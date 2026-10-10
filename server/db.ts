import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'marketplace.db');
export const db = new DatabaseSync(DB_PATH);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline_en TEXT NOT NULL,
      tagline_bn TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_bn TEXT NOT NULL,
      category TEXT NOT NULL,
      icon_url TEXT NOT NULL,
      icon_bg TEXT DEFAULT 'from-red-600 to-rose-950',
      screenshots TEXT DEFAULT '[]',
      features_en TEXT DEFAULT '[]',
      features_bn TEXT DEFAULT '[]',
      version TEXT NOT NULL,
      release_date TEXT NOT NULL,
      file_size TEXT NOT NULL,
      apk_url TEXT,
      play_store_url TEXT,
      app_store_url TEXT,
      min_android TEXT DEFAULT 'Android 8.0+',
      min_ios TEXT DEFAULT 'iOS 15.0+',
      downloads_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 120,
      is_published INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS download_logs (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      ip_hash TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Ensure email and updated_at columns exist on admins table for schema migration
  const columns = db.prepare("PRAGMA table_info(admins)").all() as Array<{ name: string }>;
  const columnNames = columns.map((c) => c.name);
  if (!columnNames.includes('email')) {
    try {
      db.exec(`ALTER TABLE admins ADD COLUMN email TEXT;`);
    } catch {}
  }
  if (!columnNames.includes('updated_at')) {
    try {
      db.exec(`ALTER TABLE admins ADD COLUMN updated_at TEXT;`);
    } catch {}
  }

  // Purge any legacy admin records with missing or empty email
  db.prepare("DELETE FROM admins WHERE email IS NULL OR email = ''").run();

  // Initialize or synchronize single authorized admin if configured in environment
  const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  if (envAdminEmail) {
    const existingAdmin = db.prepare('SELECT id, email, password_hash, salt FROM admins LIMIT 1').get() as {
      id: string;
      email: string;
      password_hash: string;
      salt: string;
    } | undefined;

    const now = new Date().toISOString();

    if (!existingAdmin) {
      if (envAdminPassword) {
        const salt = crypto.randomBytes(32).toString('hex');
        const hash = crypto.pbkdf2Sync(envAdminPassword, salt, 100000, 64, 'sha512').toString('hex');
        db.prepare(`
          INSERT INTO admins (id, email, password_hash, salt, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(crypto.randomUUID(), envAdminEmail, hash, salt, now, now);
        console.log(`[DB] Authorized admin account initialized from environment for ${envAdminEmail}`);
      }
    } else {
      // If environment email has changed, update record and invalidate existing sessions
      if (existingAdmin.email !== envAdminEmail) {
        db.prepare('UPDATE admins SET email = ?, updated_at = ? WHERE id = ?').run(envAdminEmail, now, existingAdmin.id);
        db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(existingAdmin.id);
        console.log(`[DB] Admin account email synchronized to ${envAdminEmail}`);
      }

      // If ADMIN_PASSWORD is set in environment, synchronize hash
      if (envAdminPassword) {
        const salt = crypto.randomBytes(32).toString('hex');
        const hash = crypto.pbkdf2Sync(envAdminPassword, salt, 100000, 64, 'sha512').toString('hex');
        db.prepare('UPDATE admins SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
          .run(hash, salt, now, existingAdmin.id);
      }
    }
  }

  // Seed initial applications if table is empty
  const appCount = db.prepare('SELECT count(*) as count FROM apps').get() as { count: number };
  if (appCount.count === 0) {
    seedInitialApps();
  }
}

// Get admin configuration status (safe for public query)
export function getAdminConfigStatus(): { configured: boolean; adminEmail: string | null; hasPassword: boolean } {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
  const admin = db.prepare('SELECT id, email, password_hash FROM admins LIMIT 1').get() as {
    id: string;
    email: string;
    password_hash: string;
  } | undefined;

  if (admin && admin.email) {
    return {
      configured: true,
      adminEmail: admin.email,
      hasPassword: Boolean(admin.password_hash),
    };
  }

  if (envEmail) {
    return {
      configured: true,
      adminEmail: envEmail,
      hasPassword: false,
    };
  }

  return {
    configured: false,
    adminEmail: null,
    hasPassword: false,
  };
}

// Set initial admin password (allowed only once when no admin account is yet stored in DB)
export function setInitialAdminPassword(email: string, password: string): { success: boolean; error?: string } {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const inputEmail = email.trim().toLowerCase();

  if (!envEmail || inputEmail !== envEmail) {
    return { success: false, error: 'Unauthorized: Email does not match configured ADMIN_EMAIL.' };
  }

  const existingCount = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
  if (existingCount.count > 0) {
    return { success: false, error: 'Administrator account is already initialized.' };
  }

  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO admins (id, email, password_hash, salt, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), envEmail, hash, salt, now, now);

  return { success: true };
}

// Update admin password securely
export function updateAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId) as {
    id: string;
    password_hash: string;
    salt: string;
  } | undefined;

  if (!admin) {
    return { success: false, error: 'Administrator record not found.' };
  }

  const currentHashAttempt = crypto.pbkdf2Sync(currentPassword, admin.salt, 100000, 64, 'sha512').toString('hex');
  const hashBuf = Buffer.from(admin.password_hash, 'hex');
  const attemptBuf = Buffer.from(currentHashAttempt, 'hex');

  if (hashBuf.length !== attemptBuf.length || !crypto.timingSafeEqual(hashBuf, attemptBuf)) {
    return { success: false, error: 'Incorrect current password.' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  const newSalt = crypto.randomBytes(32).toString('hex');
  const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 100000, 64, 'sha512').toString('hex');
  const now = new Date().toISOString();

  db.prepare('UPDATE admins SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
    .run(newHash, newSalt, now, adminId);

  // Invalidate all existing sessions to enforce security
  db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(adminId);

  return { success: true };
}

function seedInitialApps() {
  const now = new Date().toISOString();

  const initialApps = [
    {
      id: "hyperpulse-vpn",
      name: "HyperPulse VPN",
      tagline_en: "Next-gen zero-log WireGuard tunnel with adaptive packet masking",
      tagline_bn: "সর্বাধুনিক জিরো-লগ ওয়্যারগার্ড টানেল এবং দ্রুততম ইন্টারনেট ব্রাউজিং",
      description_en: "HyperPulse VPN delivers ultra-fast encrypted tunnels designed for high-throughput streaming and ironclad privacy. Built on a customized WireGuard core with obfuscated protocols, it safeguards connections against ISP throttling and public Wi-Fi eavesdropping without sacrificing ping or bandwidth.",
      description_bn: "হাইপারপালস ভিপিএন অতি দ্রুত এনক্রিপ্টেড টানেল প্রদান করে যা উচ্চ-গতির স্ট্রিমিং এবং নিখুঁত গোপনীয়তার জন্য প্রস্তুত। ওয়্যারগার্ড কোর প্রযুক্তি ব্যবহারে আপনার সংযোগ পাবলিক ওয়াইফাই এবং ট্র্যাকিং থেকে শতভাগ সুরক্ষিত রাখে।",
      category: "Security & Privacy",
      icon_url: "Shield",
      icon_bg: "from-red-600 to-rose-950",
      screenshots: JSON.stringify([
        {
          title: "Encrypted Node Map",
          caption: "Select lightning fast relay servers with sub-20ms roundtrip ping.",
          badge: "Zero-Latency Routing",
          previewTheme: "crimson",
          metrics: [
            { label: "Active Cipher", value: "AES-256-GCM" },
            { label: "Throughput", value: "940 Mbps" },
            { label: "Protocol", value: "PulseGuard 2.0" },
          ],
        },
        {
          title: "Per-App Firewall",
          caption: "Route sensitive banking apps through encrypted tunnels while gaming on direct fiber.",
          badge: "Split Tunnel",
          previewTheme: "dark",
          metrics: [
            { label: "Bypassed Apps", value: "14" },
            { label: "Secured Apps", value: "38" },
            { label: "DNS Protection", value: "Encrypted" },
          ],
        }
      ]),
      features_en: JSON.stringify([
        "Custom kernel-level WireGuard protocol with ChaCha20 encryption",
        "Dynamic kill-switch with DNS & WebRTC leak immunity",
        "Split tunneling for per-app traffic routing",
        "Real-time ping monitor across global nodes",
        "Zero telemetry and RAM-only server infrastructure"
      ]),
      features_bn: JSON.stringify([
        "ChaCha20 এনক্রিপশন সমৃদ্ধ কাস্টম ওয়্যারগার্ড প্রোটোকল",
        "ডিএনএস এবং ওয়েবআরটিসি লিক প্রটেকশনসহ ডায়নামিক কিল-সুইচ",
        "অ্যাপ ভিত্তিক স্প্লিট টানেলিং সুবিধা",
        "রিয়েল-টাইম পিং ও স্পিড মনিটরিং",
        "সম্পূর্ণ জিরো-লগ এবং কোনো তথ্য সংরক্ষণ না করার নিশ্চয়তা"
      ]),
      version: "3.2.0",
      release_date: "Sep 2026",
      file_size: "24.8 MB",
      apk_url: "/api/download/sample-hyperpulse-vpn.apk",
      play_store_url: "https://play.google.com/store/apps/details?id=com.maybesihab.hyperpulse",
      app_store_url: null, // Coming Soon
      min_android: "Android 9.0+",
      min_ios: "iOS 16.0+",
      downloads_count: 25420,
      rating: 4.9,
      reviews_count: 1420,
      is_published: 1,
      is_featured: 1,
    },
    {
      id: "aegis-vault",
      name: "Aegis Vault",
      tagline_en: "Hardware-backed zero-knowledge credential and secret manager",
      tagline_bn: "হার্ডওয়্যার ভিত্তিক শতভাগ নিরাপদ পাসওয়ার্ড এবং সিক্রেট ম্যানেজার",
      description_en: "Aegis Vault protects passwords, 2FA authenticator seeds, recovery phrases, and sensitive notes using client-side Argon2id key derivation and AES-256-GCM authenticated encryption. Your master password never leaves your device.",
      description_bn: "ইজিস ভল্ট আপনার সমস্ত পাসওয়ার্ড, টু-ফ্যাক্টর অ্যাথেনটিকেশন কোড এবং গোপন নোট ক্লায়েন্ট-সাইড এনক্রিপশনের মাধ্যমে সম্পূর্ণ সুরক্ষিত রাখে। আপনার মাস্টার পাসওয়ার্ড কখনো আপনার ডিভাইস ত্যাগ করে না।",
      category: "Security & Privacy",
      icon_url: "Zap",
      icon_bg: "from-red-700 to-black",
      screenshots: JSON.stringify([
        {
          title: "Master Credential Ledger",
          caption: "Quick search and auto-fill credentials across any mobile browser and application.",
          badge: "Encrypted Ledger",
          previewTheme: "crimson",
          metrics: [
            { label: "Encryption", value: "Argon2id" },
            { label: "Secure Enclave", value: "Active" },
            { label: "Leak Audit", value: "0 Breaches" },
          ],
        }
      ]),
      features_en: JSON.stringify([
        "Zero-knowledge architecture: no cloud account required",
        "Built-in TOTP and STEAM 2FA authenticator with push approve",
        "Password breach auditor matching HaveIBeenPwned k-anonymity",
        "Biometric hardware unlock via Android StrongBox & Apple Secure Enclave"
      ]),
      features_bn: JSON.stringify([
        "জিরো-নলেজ আর্কিটেকচার: ক্লাউড অ্যাকাউন্ট আবশ্যক নয়",
        "বিল্ট-ইন TOTP এবং টু-ফ্যাক্টর অথেনটিকেটর",
        "পাসওয়ার্ড নিরাপত্তা যাচাইকরণ টুল",
        "বায়োমেট্রিক ফিঙ্গারপ্রিন্ট এবং ফেস আনলক সাপোর্ট"
      ]),
      version: "4.0.1",
      release_date: "Oct 2026",
      file_size: "18.3 MB",
      apk_url: "/api/download/sample-aegis-vault.apk",
      play_store_url: "https://play.google.com/store/apps/details?id=com.maybesihab.aegisvault",
      app_store_url: "https://apps.apple.com/app/aegis-vault-pro/id1646864646",
      min_android: "Android 10.0+",
      min_ios: "iOS 15.0+",
      downloads_count: 41800,
      rating: 5.0,
      reviews_count: 3120,
      is_published: 1,
      is_featured: 1,
    },
    {
      id: "nexus-studio-pro",
      name: "Nexus Studio Pro",
      tagline_en: "Futuristic markdown notebook, code scratchpad, and terminal bridge",
      tagline_bn: "আধুনিক মার্কডাউন নোটবুক, কোড স্ক্র্যাচপ্যাড এবং ডেভেলপার ব্রিজ",
      description_en: "Nexus Studio Pro is an all-in-one developer companion combining a lightning-fast markdown canvas, Monaco-based code scratchpad, offline regex tester, and SSH tunnel monitor. Designed for mobile coders who demand desktop-grade precision.",
      description_bn: "নেক্সাস স্টুডিও প্রো হলো ডেভেলপার ও কোডারদের জন্য একটি পূর্ণাঙ্গ সমাধান যাতে রয়েছে সুপার-ফাস্ট মার্কডাউন নোট, সিনট্যাক্স হাইলাইটিংসহ কোড এডিটর এবং টার্মিনাল ব্রিজ।",
      category: "Developer Tools",
      icon_url: "Terminal",
      icon_bg: "from-zinc-800 to-red-950",
      screenshots: JSON.stringify([
        {
          title: "Monaco Scratchpad",
          caption: "Full syntax highlighting, bracket colorization, and multi-cursor editing.",
          badge: "Code Workspace",
          previewTheme: "dark",
          metrics: [
            { label: "Languages", value: "42" },
            { label: "Cold Startup", value: "180 ms" },
            { label: "RAM Footprint", value: "32 MB" },
          ],
        }
      ]),
      features_en: JSON.stringify([
        "Syntax highlighting for 40+ languages with LSP auto-complete hints",
        "Interactive regex debugger with visual token grouping",
        "Local Git snapshot engine with conflict-free branch rebasing",
        "Encrypted biometric vault for API tokens and private keys"
      ]),
      features_bn: JSON.stringify([
        "৪০+ প্রোগ্রামিং ভাষার জন্য সিনট্যাক্স হাইলাইটিং",
        "ভিজ্যুয়াল রেজেক্স টেস্ট ও ডিবাগিং সুবিধা",
        "লোকাল গিট রিপোজিটরি ও স্ন্যাপশট ট্র্যাকার",
        "এনক্রিপ্টেড এপিআই টোকেন ও পাসওয়ার্ড কিপার"
      ]),
      version: "2.5.4",
      release_date: "Aug 2026",
      file_size: "41.2 MB",
      apk_url: "/api/download/sample-nexus-studio.apk",
      play_store_url: null, // Coming Soon
      app_store_url: "https://apps.apple.com/app/nexus-studio-pro/id1646864645",
      min_android: "Android 10.0+",
      min_ios: "iOS 16.4+",
      downloads_count: 18450,
      rating: 4.8,
      reviews_count: 890,
      is_published: 1,
      is_featured: 1,
    },
    {
      id: "chronos-habit-engine",
      name: "Chronos Habit Engine",
      tagline_en: "Minimalist streak tracker with circadian rhythm time blocks",
      tagline_bn: "বায়োলজিক্যাল ঘড়ি এবং দৈনিক ফোকাস ট্র্যাকিং অ্যাপ",
      description_en: "Chronos synchronizes your daily habits with your biological clock and peak energy windows, helping developers and creators sustain long-term focus without burnout.",
      description_bn: "ক্রোনোস আপনার দৈনন্দিন অভ্যাস এবং গুরুত্বপূর্ণ কাজগুলোকে শারীরিক ক্লান্তি ও শক্তির চক্রের সাথে সমন্বয় করে উৎপাদনশীলতা বৃদ্ধি করতে সাহায্য করে।",
      category: "Productivity",
      icon_url: "Layers",
      icon_bg: "from-red-600 to-neutral-900",
      screenshots: JSON.stringify([]),
      features_en: JSON.stringify([
        "Circadian block scheduler aligning focus sprints with biological peaks",
        "Streak resilience mode allowing flexible rest days",
        "Home screen and lock screen widgets with dark AMOLED mode"
      ]),
      features_bn: JSON.stringify([
        "দৈনিক ফোকাস ব্লক ও এনার্জি ট্র্যাকিং",
        "স্ট্রিক ও হ্যাবিট প্রোগ্রেস মনিটর",
        "ডার্ক অ্যামোলেড মোড ও হোমস্ক্রিন উইজেট"
      ]),
      version: "2.1.0",
      release_date: "Oct 2026",
      file_size: "15.4 MB",
      apk_url: "/api/download/sample-chronos-engine.apk",
      play_store_url: "https://play.google.com/store/apps/details?id=com.maybesihab.chronos",
      app_store_url: null, // Coming Soon
      min_android: "Android 8.0+",
      min_ios: "iOS 15.0+",
      downloads_count: 31200,
      rating: 4.9,
      reviews_count: 1820,
      is_published: 1,
      is_featured: 1,
    },
    {
      id: "omnishare-p2p",
      name: "OmniShare P2P",
      tagline_en: "High-speed encrypted local file transfer over Wi-Fi 6 & Hotspot",
      tagline_bn: "ওয়াইফাই ৬ ও হটস্পটের মাধ্যমে হাই-স্পিড অফলাইন ফাইল ট্রান্সফার",
      description_en: "Transfer gigabytes of video, raw folders, and apps between Android, iOS, Windows, and Mac devices without mobile data or internet access. Speeds reach up to 105 MB/s using localized direct peer connections.",
      description_bn: "কোনো ইন্টারনেট ডেটা ছাড়াই অ্যান্ড্রয়েড, আইওএস ও পিসির মধ্যে চোখের পলকে মেগা ফাইল আদান-প্রদান করুন। সর্বোচ্চ ১০৫ মেগাবাইট/সেকেন্ড পর্যন্ত গতি।",
      category: "Utilities",
      icon_url: "Cpu",
      icon_bg: "from-red-600 to-neutral-900",
      screenshots: JSON.stringify([]),
      features_en: JSON.stringify([
        "Transfer speeds up to 105 MB/s utilizing Wi-Fi 6 Direct technology",
        "Cross-platform browser receiver: no app needed on receiving PC",
        "Zero internet connection required — works anywhere, anytime"
      ]),
      features_bn: JSON.stringify([
        "ওয়াইফাই ডিরেক্ট প্রযুক্তিতে ১০৫ এমবি/সেকেন্ড পর্যন্ত গতি",
        "পিসির ব্রাউজারে অ্যাপ ছাড়াই ফাইল রিসিভ করার সুবিধা",
        "কোনো ইন্টারনেট ডেটা বা ক্লাউড সংযোগের প্রয়োজন নেই"
      ]),
      version: "2.8.1",
      release_date: "Sep 2026",
      file_size: "19.5 MB",
      apk_url: "/api/download/sample-omnishare.apk",
      play_store_url: "https://play.google.com/store/apps/details?id=com.maybesihab.omnishare",
      app_store_url: null, // Coming Soon
      min_android: "Android 8.0+",
      min_ios: "iOS 14.0+",
      downloads_count: 34100,
      rating: 4.9,
      reviews_count: 1640,
      is_published: 1,
      is_featured: 1,
    },
    {
      id: "quantum-audio-lab",
      name: "Quantum Audio Lab",
      tagline_en: "32-band parametric equalizer, spatial soundstage & FLAC player",
      tagline_bn: "৩২-ব্যান্ড প্যারামেট্রিক ইকুয়ালাইজার এবং হাই-রেস অডিও প্লেয়ার",
      description_en: "Quantum Audio Lab transforms ordinary headphones into an audiophile listening environment. Featuring bit-perfect bitstream playback up to 192kHz/24-bit, convolution reverb simulation, and custom ear-profile HRTF calibration.",
      description_bn: "কোয়ান্টাম অডিও ল্যাব সাধারণ হেডফোনেও স্টুডিও-লেভেল সাউন্ড কোয়ালিটি প্রদান করে। এতে রয়েছে ১৯২ কিলোহার্টজ ২৪-বিট সাপোর্ট ও প্রফেশনাল সাউন্ড টিউনিং।",
      category: "Audio & Media",
      icon_url: "Headphones",
      icon_bg: "from-rose-600 to-zinc-950",
      screenshots: JSON.stringify([]),
      features_en: JSON.stringify([
        "Direct USB-DAC hardware bypass for bit-perfect audio delivery",
        "32-band high-precision parametric EQ with adjustable Q-factor",
        "Hi-Res audio format support: FLAC, ALAC, DSD64, DSD128, WAV"
      ]),
      features_bn: JSON.stringify([
        "ইউএসবি-ডিএসি বাইপাসসহ বিট-পারফেক্ট আউটপুট",
        "৩২-ব্যান্ড প্রিসিশন প্যারামেট্রিক ইকুয়ালাইজার",
        "ফ্ল্যাক এবং হাই-রেস অডিও ফরম্যাট সাপোর্ট"
      ]),
      version: "1.8.2",
      release_date: "Jul 2026",
      file_size: "36.7 MB",
      apk_url: "/api/download/sample-quantum-audio.apk",
      play_store_url: null, // Coming Soon
      app_store_url: null,  // Coming Soon
      min_android: "Android 11.0+",
      min_ios: "iOS 16.0+",
      downloads_count: 9820,
      rating: 4.7,
      reviews_count: 640,
      is_published: 1,
      is_featured: 0,
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO apps (
      id, name, tagline_en, tagline_bn, description_en, description_bn,
      category, icon_url, icon_bg, screenshots, features_en, features_bn,
      version, release_date, file_size, apk_url, play_store_url, app_store_url,
      min_android, min_ios, downloads_count, rating, reviews_count,
      is_published, is_featured, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  for (const app of initialApps) {
    stmt.run(
      app.id,
      app.name,
      app.tagline_en,
      app.tagline_bn,
      app.description_en,
      app.description_bn,
      app.category,
      app.icon_url,
      app.icon_bg,
      app.screenshots,
      app.features_en,
      app.features_bn,
      app.version,
      app.release_date,
      app.file_size,
      app.apk_url,
      app.play_store_url,
      app.app_store_url,
      app.min_android,
      app.min_ios,
      app.downloads_count,
      app.rating,
      app.reviews_count,
      app.is_published,
      app.is_featured,
      now,
      now
    );
  }

  console.log(`[DB] Seeded ${initialApps.length} initial applications into SQLite database.`);
}
