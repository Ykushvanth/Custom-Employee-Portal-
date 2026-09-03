const { getZohoAppUrl, getAuthorizationUrl, exchangeCodeForTokens } = require('../services/zohoService');
const { AuditLog } = require('../models');

// Get authorized Zoho applications for current user
exports.getAuthorizedApps = async (req, res) => {
  try {
    const userRoles = req.user.roles || [];

    // Map roles to their Zoho apps
    const authorizedApps = userRoles
      .filter(role => role.zohoApp)
      .map(role => ({
        name: role.zohoApp,
        url: getZohoAppUrl(role.zohoApp),
        roleName: role.name
      }));

    // Admin gets access to all apps
    if (userRoles.some(role => role.name === 'Admin')) {
      const allApps = [
        { name: 'Zoho People', url: getZohoAppUrl('Zoho People'), roleName: 'Admin' },
        { name: 'Zoho CRM', url: getZohoAppUrl('Zoho CRM'), roleName: 'Admin' },
        { name: 'Zoho Desk', url: getZohoAppUrl('Zoho Desk'), roleName: 'Admin' },
        { name: 'Zoho Books', url: getZohoAppUrl('Zoho Books'), roleName: 'Admin' }
      ];
      return res.json({
        success: true,
        data: { apps: allApps }
      });
    }

    res.json({
      success: true,
      data: { apps: authorizedApps }
    });

  } catch (error) {
    console.error('Get authorized apps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch authorized apps',
      error: error.message
    });
  }
};

// Generate Zoho app access URL (for redirecting users)
exports.getAppAccessUrl = async (req, res) => {
  try {
    const { appName } = req.params;

    // Verify user has access to this app
    const userRoles = req.user.roles || [];
    const hasAccess = userRoles.some(role =>
      role.name === 'Admin' || role.zohoApp === appName
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `You don't have access to ${appName}`
      });
    }

    const appUrl = getZohoAppUrl(appName);

    if (!appUrl) {
      return res.status(400).json({
        success: false,
        message: `Invalid Zoho app: ${appName}`
      });
    }

    // Log the access
    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_app_redirect',
      resource: appName,
      details: { app: appName, url: appUrl },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        appName,
        url: appUrl,
        message: 'Redirect user to this URL'
      }
    });

  } catch (error) {
    console.error('Get app URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate app URL',
      error: error.message
    });
  }
};

// OAuth setup endpoints (for initial configuration)
exports.getOAuthUrl = (req, res) => {
  try {
    const authUrl = getAuthorizationUrl();
    res.json({
      success: true,
      data: {
        authUrl,
        message: 'Visit this URL to authorize the application and get the authorization code'
      }
    });
  } catch (error) {
    console.error('Get OAuth URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OAuth URL',
      error: error.message
    });
  }
};

// Handle OAuth callback
exports.handleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const tokens = await exchangeCodeForTokens(code);

    res.json({
      success: true,
      data: {
        message: 'Authorization successful. Add the refresh_token to your .env file as ZOHO_REFRESH_TOKEN',
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in
      }
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: 'OAuth authorization failed',
      error: error.message
    });
  }
};
