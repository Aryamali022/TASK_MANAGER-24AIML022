const jwt = require('jsonwebtoken');

// Runs BEFORE any protected route.
// Job: read the token from the "Authorization" header, check it is genuine,
// and hang the logged-in user off req.user so the route can use it.
function auth(req, res, next) {
  const header = req.headers.authorization || '';

  // Expected format:  Authorization: Bearer <token>
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.slice('Bearer '.length);

  try {
    // Throws if the token was tampered with, or if it has expired.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: payload.id, email: payload.email };
    next(); // hand over to the next middleware / the route itself
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = auth;
