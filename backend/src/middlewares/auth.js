const { verifyToken } = require('../utils/jwt');
const { User, Role, AuditLog } = require('../models');

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

    // Verify token and get user ID
    const decoded = verifyToken(token);

    // Fetch fresh user data with current roles from database
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or has been deleted'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Attach fresh user info with current roles to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles
    };

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
