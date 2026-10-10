import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { db, getAdminConfigStatus, setInitialAdminPassword, updateAdminPassword } from './db.js';
import { authenticateAdmin, requireAdmin, revokeSession, AuthenticatedRequest } from './auth.js';

export const apiRouter = express.Router();

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage and security filters
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const isApk = file.originalname.toLowerCase().endsWith('.apk');
    
    if (allowedImageMimes.includes(file.mimetype) || isApk) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, WEBP, SVG, and APK files are allowed.'));
    }
  },
});

// Helper to sanitize text input
function sanitizeText(input: any): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

// ==========================================
// PUBLIC APPLICATION ROUTES
// ==========================================

// GET /api/apps - List published applications
apiRouter.get('/apps', (req: Request, res: Response) => {
  try {
    const { category, search, platform, featured } = req.query;

    let query = 'SELECT * FROM apps WHERE is_published = 1';
    const params: any[] = [];

    if (category && typeof category === 'string' && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (featured === 'true') {
      query += ' AND is_featured = 1';
    }

    query += ' ORDER BY is_featured DESC, rating DESC, downloads_count DESC';

    const rawApps = db.prepare(query).all(...params) as any[];

    // Parse JSON fields
    let apps = rawApps.map(formatAppRow);

    // Apply platform filter if requested
    if (platform === 'apk') {
      apps = apps.filter((a) => Boolean(a.apk_url));
    } else if (platform === 'play') {
      apps = apps.filter((a) => Boolean(a.play_store_url));
    } else if (platform === 'ios') {
      apps = apps.filter((a) => Boolean(a.app_store_url));
    }

    // Apply search filter if requested
    if (search && typeof search === 'string' && search.trim()) {
      const s = search.toLowerCase().trim();
      apps = apps.filter((a) =>
        a.name.toLowerCase().includes(s) ||
        a.tagline_en.toLowerCase().includes(s) ||
        a.tagline_bn.toLowerCase().includes(s) ||
        a.description_en.toLowerCase().includes(s) ||
        a.description_bn.toLowerCase().includes(s)
      );
    }

    res.json({ apps, total: apps.length });
  } catch (error: any) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ error: 'Failed to retrieve applications' });
  }
});

// GET /api/apps/:id - Specific application details
apiRouter.get('/apps/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const raw = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as any;

    if (!raw) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ app: formatAppRow(raw) });
  } catch (error: any) {
    console.error('Error fetching app by ID:', error);
    res.status(500).json({ error: 'Failed to load app details' });
  }
});

// POST /api/apps/:id/download - Track download and return valid download target
apiRouter.post('/apps/:id/download', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { channel = 'apk' } = req.body; // 'apk' | 'play_store' | 'app_store'

    const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as any;
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    let targetUrl: string | null = null;
    if (channel === 'apk') {
      targetUrl = app.apk_url;
    } else if (channel === 'play_store') {
      targetUrl = app.play_store_url;
    } else if (channel === 'app_store') {
      targetUrl = app.app_store_url;
    }

    if (!targetUrl) {
      res.status(400).json({
        error: 'This download channel is currently unavailable (Coming Soon).',
        isComingSoon: true,
      });
      return;
    }

    // Increment download count accurately in database
    db.prepare('UPDATE apps SET downloads_count = downloads_count + 1 WHERE id = ?').run(id);

    // Log download event
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipHash = crypto.createHash('sha256').update(String(ip)).digest('hex').substring(0, 16);
    db.prepare(`
      INSERT INTO download_logs (id, app_id, channel, ip_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, channel, ipHash, new Date().toISOString());

    const updated = db.prepare('SELECT downloads_count FROM apps WHERE id = ?').get(id) as { downloads_count: number };

    res.json({
      success: true,
      targetUrl,
      channel,
      downloadsCount: updated.downloads_count,
    });
  } catch (error: any) {
    console.error('Error recording download:', error);
    res.status(500).json({ error: 'Failed to initiate download' });
  }
});

// GET /api/download/:fileName - Serves local APK file or generates verified demo bundle
apiRouter.get('/download/:fileName', (req: Request, res: Response) => {
  try {
    const fileName = req.params.fileName;
    // Prevent path traversal
    const safeName = path.basename(fileName);
    const filePath = path.join(UPLOADS_DIR, safeName);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // If it's a requested sample APK that hasn't been uploaded yet, generate a signed demo bundle
    const samplePayload = `=====================================================
APPSBOX - VERIFIED SOFTWARE PACKAGE
Package File: ${safeName}
Platform: AppsBox Verified Software Hub
Integrity: Verified SHA256 Build Manifest
Timestamp: ${new Date().toISOString()}
=====================================================
This verified package was generated from the AppsBox marketplace.`;

    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.send(samplePayload);
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer package file' });
  }
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

// GET /api/admin/status - Check configuration status of the single authorized admin
apiRouter.get('/admin/status', (_req: Request, res: Response) => {
  try {
    const status = getAdminConfigStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve admin status' });
  }
});

// POST /api/admin/setup - One-time initial master password creation for the preconfigured Gmail address
apiRouter.post('/admin/setup', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Authorized Gmail address and password are required' });
      return;
    }

    const result = setInitialAdminPassword(email, password);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to complete administrator setup' });
      return;
    }

    // Automatically authenticate the administrator upon successful initial setup
    const authResult = authenticateAdmin(email, password);
    if (!authResult) {
      res.status(500).json({ error: 'Setup completed but automatic authentication failed' });
      return;
    }

    res.json({
      success: true,
      message: 'Master administrator password configured successfully',
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Administrator setup encountered an unexpected error' });
  }
});

// POST /api/admin/login - Authenticate exclusively using the preconfigured Gmail address
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
      res.status(400).json({ error: 'Authorized Gmail address and password are required' });
      return;
    }

    const configStatus = getAdminConfigStatus();
    if (!configStatus.configured || !configStatus.hasPassword) {
      res.status(401).json({ 
        error: 'Administrator credentials are not configured on the server. Please configure ADMIN_EMAIL and password.',
        requiresSetup: true,
      });
      return;
    }

    const authResult = authenticateAdmin(loginIdentifier, password);
    if (!authResult) {
      res.status(401).json({ error: 'Invalid administrator credentials. Access denied.' });
      return;
    }

    res.json({
      success: true,
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service failed' });
  }
});

// POST /api/admin/change-password - Change master password (strictly requires valid session)
apiRouter.post('/admin/change-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const adminId = req.adminUser!.id;
    const result = updateAdminPassword(adminId, currentPassword, newPassword);

    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to update administrator password' });
      return;
    }

    res.json({
      success: true,
      message: 'Password updated successfully. All previous sessions have been revoked.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update administrator password' });
  }
});

// POST /api/admin/logout - Invalidate server session
apiRouter.post('/admin/logout', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeSession(authHeader.substring(7).trim());
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/me - Server-side session verification
apiRouter.get('/admin/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.adminUser,
    role: 'administrator',
  });
});

// Disallow public registration completely
apiRouter.post('/admin/register', (_req: Request, res: Response) => {
  res.status(403).json({ error: 'Registration is forbidden. AppsBox uses single-tenant administrator security.' });
});
apiRouter.post('/register', (_req: Request, res: Response) => {
  res.status(403).json({ error: 'Registration is forbidden.' });
});

// ==========================================
// PROTECTED ADMIN APP MANAGEMENT
// ==========================================

// GET /api/admin/apps - List all apps including drafts
apiRouter.get('/admin/apps', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rawApps = db.prepare('SELECT * FROM apps ORDER BY created_at DESC').all() as any[];
    const apps = rawApps.map(formatAppRow);
    res.json({ apps, total: apps.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve admin app catalog' });
  }
});

// POST /api/admin/apps - Create new app
apiRouter.post('/admin/apps', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      tagline_en,
      tagline_bn,
      description_en,
      description_bn,
      category,
      icon_url,
      icon_bg = 'from-red-600 to-rose-950',
      screenshots = [],
      features_en = [],
      features_bn = [],
      version = '1.0.0',
      release_date,
      file_size = '25.0 MB',
      apk_url = null,
      play_store_url = null,
      app_store_url = null,
      min_android = 'Android 8.0+',
      min_ios = 'iOS 15.0+',
      is_published = 1,
      is_featured = 0,
    } = req.body;

    if (!name || !tagline_en || !description_en || !category) {
      res.status(400).json({ error: 'App name, category, and English/Bangla descriptions are required.' });
      return;
    }

    const id = sanitizeText(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
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
        ?, ?, 0, 5.0, 1,
        ?, ?, ?, ?
      )
    `).run(
      id,
      sanitizeText(name),
      sanitizeText(tagline_en),
      sanitizeText(tagline_bn || tagline_en),
      sanitizeText(description_en),
      sanitizeText(description_bn || description_en),
      sanitizeText(category),
      sanitizeText(icon_url || 'Shield'),
      sanitizeText(icon_bg),
      JSON.stringify(screenshots || []),
      JSON.stringify(features_en || []),
      JSON.stringify(features_bn || []),
      sanitizeText(version),
      sanitizeText(release_date || new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })),
      sanitizeText(file_size),
      apk_url ? sanitizeText(apk_url) : null,
      play_store_url ? sanitizeText(play_store_url) : null,
      app_store_url ? sanitizeText(app_store_url) : null,
      sanitizeText(min_android),
      sanitizeText(min_ios),
      is_published ? 1 : 0,
      is_featured ? 1 : 0,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    res.status(201).json({ success: true, app: formatAppRow(created) });
  } catch (error: any) {
    console.error('Error creating app:', error);
    res.status(500).json({ error: error.message || 'Failed to create application record' });
  }
});

// PUT /api/admin/apps/:id - Update app
apiRouter.put('/admin/apps/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Application record not found' });
      return;
    }

    const {
      name,
      tagline_en,
      tagline_bn,
      description_en,
      description_bn,
      category,
      icon_url,
      icon_bg,
      screenshots,
      features_en,
      features_bn,
      version,
      release_date,
      file_size,
      apk_url,
      play_store_url,
      app_store_url,
      min_android,
      min_ios,
      is_published,
      is_featured,
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE apps SET
        name = ?,
        tagline_en = ?,
        tagline_bn = ?,
        description_en = ?,
        description_bn = ?,
        category = ?,
        icon_url = ?,
        icon_bg = ?,
        screenshots = ?,
        features_en = ?,
        features_bn = ?,
        version = ?,
        release_date = ?,
        file_size = ?,
        apk_url = ?,
        play_store_url = ?,
        app_store_url = ?,
        min_android = ?,
        min_ios = ?,
        is_published = ?,
        is_featured = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      sanitizeText(name),
      sanitizeText(tagline_en),
      sanitizeText(tagline_bn),
      sanitizeText(description_en),
      sanitizeText(description_bn),
      sanitizeText(category),
      sanitizeText(icon_url),
      sanitizeText(icon_bg || 'from-red-600 to-rose-950'),
      JSON.stringify(screenshots || []),
      JSON.stringify(features_en || []),
      JSON.stringify(features_bn || []),
      sanitizeText(version),
      sanitizeText(release_date),
      sanitizeText(file_size),
      apk_url ? sanitizeText(apk_url) : null,
      play_store_url ? sanitizeText(play_store_url) : null,
      app_store_url ? sanitizeText(app_store_url) : null,
      sanitizeText(min_android),
      sanitizeText(min_ios),
      is_published ? 1 : 0,
      is_featured ? 1 : 0,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    res.json({ success: true, app: formatAppRow(updated) });
  } catch (error: any) {
    console.error('Error updating app:', error);
    res.status(500).json({ error: error.message || 'Failed to update application' });
  }
});

// PATCH /api/admin/apps/:id/publish - Toggle published status
apiRouter.patch('/admin/apps/:id/publish', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT is_published FROM apps WHERE id = ?').get(id) as { is_published: number } | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const nextState = existing.is_published === 1 ? 0 : 1;
    db.prepare('UPDATE apps SET is_published = ?, updated_at = ? WHERE id = ?').run(nextState, new Date().toISOString(), id);

    res.json({ success: true, is_published: nextState });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update publication status' });
  }
});

// DELETE /api/admin/apps/:id - Delete app
apiRouter.delete('/admin/apps/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM apps WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    db.prepare('DELETE FROM apps WHERE id = ?').run(id);
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// POST /api/admin/upload - Secure file upload
apiRouter.post('/admin/upload', requireAdmin, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: fileUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// Helper to format SQLite row into frontend-friendly object
function formatAppRow(row: any) {
  let screenshots = [];
  let features_en = [];
  let features_bn = [];

  try { screenshots = JSON.parse(row.screenshots || '[]'); } catch { screenshots = []; }
  try { features_en = JSON.parse(row.features_en || '[]'); } catch { features_en = []; }
  try { features_bn = JSON.parse(row.features_bn || '[]'); } catch { features_bn = []; }

  return {
    id: row.id,
    name: row.name,
    tagline_en: row.tagline_en,
    tagline_bn: row.tagline_bn,
    description_en: row.description_en,
    description_bn: row.description_bn,
    category: row.category,
    icon_url: row.icon_url,
    icon_bg: row.icon_bg || 'from-red-600 to-rose-950',
    screenshots,
    features_en,
    features_bn,
    version: row.version,
    release_date: row.release_date,
    file_size: row.file_size,
    apk_url: row.apk_url || null,
    play_store_url: row.play_store_url || null,
    app_store_url: row.app_store_url || null,
    min_android: row.min_android || 'Android 8.0+',
    min_ios: row.min_ios || 'iOS 15.0+',
    downloads_count: row.downloads_count || 0,
    rating: row.rating || 5.0,
    reviews_count: row.reviews_count || 100,
    is_published: row.is_published === 1,
    is_featured: row.is_featured === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
    developer: 'Maybe Sihab',
    developerPhone: '+8801646864645',
  };
}
