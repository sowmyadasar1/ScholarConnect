/**
 * Auth Middleware — JWT Verification
 *
 * Extracts the token from "Authorization: Bearer <token>" header,
 * verifies it, and attaches req.user = { id, email, is_admin }.
 */

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    req.user = decoded; // { id, email, is_admin }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { authenticate };
