const { verifyToken } = require('../utils/jwt');
const { AuditLog } = require('../models');

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    // Log failed authentication attempt
    await AuditLog.create({
      userId: null,
      action: 'authentication_failed',
      resource: 'auth',
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'failure'
    }).catch(err => console.error('Failed to log auth failure:', err));

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticate };
