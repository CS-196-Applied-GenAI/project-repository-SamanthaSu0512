/**
 * Require a valid session. Use on all /api/* routes except POST /api/auth/login and POST /api/auth/signup.
 * Health routes (GET /health, GET /health/db) are also unauthenticated.
 */
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = requireAuth;
