const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Validate JWT_SECRET is configured
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.'
  );
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET is too short. Please use a secure secret key with at least 32 characters.'
  );
}

// Generate JWT token
const generateToken = (userId) => {
  const payload = {
    id: userId
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Decode JWT without verification (for debugging)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
