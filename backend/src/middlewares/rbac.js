const { AuditLog } = require('../models');

// Middleware to check if user has required role(s)
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user's roles from JWT token
      const userRoles = req.user.roles || [];
      const userRoleNames = userRoles.map(role => role.name);

      // Check if user has any of the allowed roles
      const hasRole = allowedRoles.some(role => userRoleNames.includes(role));

      if (!hasRole) {
        // Log unauthorized access attempt
        await AuditLog.create({
          userId: req.user.id,
          action: 'unauthorized_access',
          resource: req.path,
          details: {
            requiredRoles: allowedRoles,
            userRoles: userRoleNames,
            method: req.method
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failure'
        });

        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message
      });
    }
  };
};

// Middleware to check if user has Admin role
const requireAdmin = requireRole('Admin');

// Middleware to check if user has permission to access Zoho app
const requireZohoAccess = (zohoAppName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRoles = req.user.roles || [];

      // Admin has access to all Zoho apps
      if (userRoles.some(role => role.name === 'Admin')) {
        return next();
      }

      // Check if user's role has access to the requested Zoho app
      const hasAccess = userRoles.some(role => role.zohoApp === zohoAppName);

      if (!hasAccess) {
        // Log unauthorized Zoho access attempt
        await AuditLog.create({
          userId: req.user.id,
          action: 'unauthorized_zoho_access',
          resource: zohoAppName,
          details: {
            requestedApp: zohoAppName,
            userRoles: userRoles.map(r => ({ name: r.name, zohoApp: r.zohoApp }))
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failure'
        });

        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to access ${zohoAppName}`
        });
      }

      // Log successful Zoho app access
      await AuditLog.create({
        userId: req.user.id,
        action: 'zoho_app_access',
        resource: zohoAppName,
        details: { app: zohoAppName },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success'
      });

      next();
    } catch (error) {
      console.error('Zoho access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireZohoAccess
};
