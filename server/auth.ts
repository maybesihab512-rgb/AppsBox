import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

// Derive a secure PBKDF2 hash using SHA-512 with 100,000 iterations
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Constant-time password verification against stored PBKDF2 hash
export function verifyPassword(passwordAttempt: string, storedHash: string, salt: string): boolean {
  try {
    const hashAttempt = crypto.pbkdf2Sync(passwordAttempt, salt, 100000, 64, 'sha512').toString('hex');
    const hashBuffer = Buffer.from(storedHash, 'hex');
    const attemptBuffer = Buffer.from(hashAttempt, 'hex');

    if (hashBuffer.length !== attemptBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, attemptBuffer);
  } catch {
    return false;
  }
}

// Verify administrator credentials strictly by preconfigured Gmail address and password
export function authenticateAdmin(
  emailAttempt: string,
  passwordAttempt: string
): { user: AdminUser; token: string } | null {
  if (!emailAttempt || !passwordAttempt) return null;

  const normalizedEmail = emailAttempt.toLowerCase().trim();
  const configuredEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();

  // If ADMIN_EMAIL is set in the server environment, ensure the attempt matches it strictly
  if (configuredEmail && normalizedEmail !== configuredEmail) {
    return null;
  }

  // Look up admin exclusively by normalized email
  const admin = db.prepare('SELECT * FROM admins WHERE LOWER(email) = ?').get(normalizedEmail) as {
    id: string;
    email: string;
    password_hash: string;
    salt: string;
    created_at: string;
  } | undefined;

  if (!admin) return null;

  const isValid = verifyPassword(passwordAttempt, admin.password_hash, admin.salt);
  if (!isValid) return null;

  // Create cryptographically secure random session token valid for 7 days
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  db.prepare(`
    INSERT INTO sessions (token, admin_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(token, admin.id, now.toISOString(), expires.toISOString());

  return {
    user: {
      id: admin.id,
      email: admin.email,
      created_at: admin.created_at,
    },
    token,
  };
}

// Invalidate session token on logout
export function revokeSession(token: string) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Retrieve authenticated admin user from valid session token
export function getAdminFromToken(token: string): AdminUser | null {
  if (!token) return null;

  const session = db.prepare(`
    SELECT s.token, s.expires_at, a.id, a.email, a.created_at
    FROM sessions s
    JOIN admins a ON s.admin_id = a.id
    WHERE s.token = ?
  `).get(token) as {
    token: string;
    expires_at: string;
    id: string;
    email: string;
    created_at: string;
  } | undefined;

  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    // Session expired - purge from database
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return {
    id: session.id,
    email: session.email,
    created_at: session.created_at,
  };
}

// Express Auth Middleware: strictly enforces server-side authorization
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const admin = getAdminFromToken(token);

  if (!admin) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  req.adminUser = admin;
  next();
}
