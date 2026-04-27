/**
 * Admin Middleware
 *
 * Must be used AFTER auth middleware (needs req.user).
 * Checks admin status from the DATABASE (not JWT) to avoid stale-token 403s.
 */

const UserModel = require('../models/user.model');

async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Always check the DB for current admin status — JWT may be stale
    const user = await UserModel.findById(req.user.id);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    // Patch req.user so downstream handlers have the fresh flag
    req.user.is_admin = user.is_admin;
    next();
  } catch (err) {
    console.error('[Admin Middleware] DB check failed:', err.message);
    return res.status(500).json({ error: 'Failed to verify admin status.' });
  }
}

module.exports = { requireAdmin };
