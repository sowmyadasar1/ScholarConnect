/**
 * Admin Middleware
 *
 * Must be used AFTER auth middleware (needs req.user).
 * Simply checks the is_admin flag from the JWT payload.
 */

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAdmin };
