import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'marketplace.db');
export const db = new DatabaseSync(DB_PATH);

type AdminColumn = {
  name: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
};

function getAdminColumns(): AdminColumn[] {
  return db.prepare('PRAGMA table_info(admins)').all() as AdminColumn[];
}

function insertAdmin(
  id: string,
  email: string,
  passwordHash: string,
  salt: string,
  now: string
): void {
  const columns = getAdminColumns();
  const names = new Set(columns.map((column) => column.name));

  const insertColumns: string[] = [];
  const values: unknown[] = [];

  const add = (column: string, value: unknown) => {
    if (names.has(column)) {
      insertColumns.push(column);
      values.push(value);
    }
  };

  add('id', id);
  add('username', email);
  add('email', email);
  add('password_hash', passwordHash);
  add('salt', salt);
  add('created_at', now);
  add('updated_at', now);

  for (const column of columns) {
    if (
      column.notnull &&
      column.dflt_value === null &&
      !column.pk &&
      !insertColumns.includes(column.name)
    ) {
      throw new Error(
        `Cannot initialize admin: required database column "${column.name}" has no value.`
      );
    }
  }

  const placeholders = insertColumns.map(() => '?').join(', ');
  const sql = `INSERT INTO admins (${insertColumns.join(', ')}) VALUES (${placeholders})`;

  db.prepare(sql).run(...values);
}

function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
}

export function initDatabase(): void {
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

  // Migrate legacy admin schemas without deleting existing app data.
  let columns = getAdminColumns();
  let names = new Set(columns.map((column) => column.name));

  if (!names.has('email')) {
    db.exec('ALTER TABLE admins ADD COLUMN email TEXT');
  }

  columns = getAdminColumns();
  names = new Set(columns.map((column) => column.name));

  if (!names.has('updated_at')) {
    db.exec('ALTER TABLE admins ADD COLUMN updated_at TEXT');
  }

  // Remove only legacy records that cannot be identified by email.
  db.prepare(
    "DELETE FROM admins WHERE email IS NULL OR TRIM(email) = ''"
  ).run();

  const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  if (envAdminEmail) {
    const existingAdmin = db
      .prepare(
        'SELECT id, email, password_hash, salt FROM admins LIMIT 1'
      )
      .get() as {
        id: string;
        email: string;
        password_hash: string;
        salt: string;
      } | undefined;

    const now = new Date().toISOString();

    if (!existingAdmin) {
      if (envAdminPassword) {
        const salt = crypto.randomBytes(32).toString('hex');
        const hash = hashPassword(envAdminPassword, salt);

        insertAdmin(
          crypto.randomUUID(),
          envAdminEmail,
          hash,
          salt,
          now
        );

        console.log(
          `[DB] Authorized admin account initialized for ${envAdminEmail}`
        );
      }
    } else {
      if (existingAdmin.email !== envAdminEmail) {
        db.prepare(
          'UPDATE admins SET email = ?, updated_at = ? WHERE id = ?'
        ).run(envAdminEmail, now, existingAdmin.id);

        // Keep a legacy username synchronized when that column exists.
        const adminColumns = getAdminColumns();
        if (adminColumns.some((column) => column.name === 'username')) {
          db.prepare(
            'UPDATE admins SET username = ? WHERE id = ?'
          ).run(envAdminEmail, existingAdmin.id);
        }

        db.prepare(
          'DELETE FROM sessions WHERE admin_id = ?'
        ).run(existingAdmin.id);

        console.log('[DB] Admin email synchronized.');
      }

      if (envAdminPassword) {
        const salt = crypto.randomBytes(32).toString('hex');
        const hash = hashPassword(envAdminPassword, salt);

        db.prepare(
          'UPDATE admins SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?'
        ).run(hash, salt, now, existingAdmin.id);
      }
    }
  }

  // Demo apps are intentionally not seeded.
}

export function getAdminConfigStatus(): {
  configured: boolean;
  adminEmail: string | null;
  hasPassword: boolean;
} {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;

  const admin = db
    .prepare('SELECT id, email, password_hash FROM admins LIMIT 1')
    .get() as {
      id: string;
      email: string | null;
      password_hash: string;
    } | undefined;

  if (admin?.email) {
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

export function setInitialAdminPassword(
  email: string,
  password: string
): { success: boolean; error?: string } {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const inputEmail = email.trim().toLowerCase();

  if (!envEmail || inputEmail !== envEmail) {
    return {
      success: false,
      error: 'Unauthorized: Email does not match configured ADMIN_EMAIL.',
    };
  }

  const existingCount = db
    .prepare('SELECT count(*) AS count FROM admins')
    .get() as { count: number };

  if (existingCount.count > 0) {
    return {
      success: false,
      error: 'Administrator account is already initialized.',
    };
  }

  if (!password || password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters long.',
    };
  }

  const salt = crypto.randomBytes(32).toString('hex');
  const hash = hashPassword(password, salt);
  const now = new Date().toISOString();

  insertAdmin(
    crypto.randomUUID(),
    envEmail,
    hash,
    salt,
    now
  );

  return { success: true };
}

export function updateAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const admin = db
    .prepare('SELECT * FROM admins WHERE id = ?')
    .get(adminId) as {
      id: string;
      password_hash: string;
      salt: string;
    } | undefined;

  if (!admin) {
    return {
      success: false,
      error: 'Administrator record not found.',
    };
  }

  const currentHash = hashPassword(currentPassword, admin.salt);
  const storedBuffer = Buffer.from(admin.password_hash, 'hex');
  const attemptBuffer = Buffer.from(currentHash, 'hex');

  if (
    storedBuffer.length !== attemptBuffer.length ||
    !crypto.timingSafeEqual(storedBuffer, attemptBuffer)
  ) {
    return {
      success: false,
      error: 'Incorrect current password.',
    };
  }

  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: 'New password must be at least 8 characters long.',
    };
  }

  const newSalt = crypto.randomBytes(32).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  const now = new Date().toISOString();

  db.prepare(
    'UPDATE admins SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?'
  ).run(newHash, newSalt, now, adminId);

  db.prepare(
    'DELETE FROM sessions WHERE admin_id = ?'
  ).run(adminId);

  return { success: true };
    }
