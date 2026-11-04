const jwt = require('jsonwebtoken');
const User = require('../models/User');

function readToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

async function resolveUser(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id).lean();
  } catch {
    return null;
  }
}

const verifyToken = async (req, res, next) => {
  const user = await resolveUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Please log in to continue' });
  req.user = user;
  return next();
};

// Attaches req.user when a valid token is present, but never blocks.
const optionalAuth = async (req, res, next) => {
  req.user = await resolveUser(req);
  next();
};

module.exports = { verifyToken, optionalAuth };
