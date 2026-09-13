import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sanjhi_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ [SECURITY WARNING] process.env.JWT_SECRET is not set! Using default secret in production is unsafe.');
}

/**
 * Sign a JWT token for a user
 * @param {object} payload - { userId, phone, email }
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 * @param {string} token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to authenticate requests with Bearer token
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

/**
 * Express middleware that requires the authenticated user to exist in the `admins` table.
 * Uses a LEFT JOIN query against the admins table — NO is_admin flag on users.
 * Returns 403 if authenticated user is not an admin.
 */
export async function requireAdmin(req, res, next) {
  // First verify the token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = decoded;

  // Then check admins table
  try {
    const result = await query(
      `SELECT a.id AS admin_id, a.granted_at
       FROM admins a
       WHERE a.user_id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.admin = result.rows[0]; // attach admin metadata to request
    next();
  } catch (err) {
    console.error('requireAdmin DB error:', err.message);
    return res.status(500).json({ error: 'Internal server error during admin verification' });
  }
}
