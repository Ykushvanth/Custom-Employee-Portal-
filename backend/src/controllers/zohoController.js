const { getZohoAppUrl, getAuthorizationUrl, exchangeCodeForTokens, makeZohoRequest } = require('../services/zohoService');
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

    // Debug: Log the full response from Zoho
    console.log('Zoho token response:', JSON.stringify(tokens, null, 2));

    res.json({
      success: true,
      data: {
        message: 'Authorization successful. Add the refresh_token to your .env file as ZOHO_REFRESH_TOKEN',
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in,
        fullResponse: tokens // Include full response to see what Zoho actually returns
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

// ============================================
// ZOHO API PROXY ENDPOINTS
// These endpoints fetch actual data from Zoho APIs using the backend service account
// ============================================

// Fetch Zoho People data (HR - Employee Management)
exports.getZohoPeopleData = async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    const hasAccess = userRoles.some(role =>
      role.name === 'Admin' || role.zohoApp === 'Zoho People'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You need HR role to access Zoho People data.'
      });
    }

    // Fetch employee records from Zoho People API
    // Note: This is a sample endpoint - actual endpoints vary by Zoho People configuration
    const data = await makeZohoRequest('Zoho People', '/api/forms/employee/getRecords', 'GET');

    // Log successful access
    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_people_data_access',
      resource: 'Zoho People',
      details: { endpoint: '/api/forms/employee/getRecords' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        app: 'Zoho People',
        records: data,
        message: 'Employee data fetched successfully'
      }
    });

  } catch (error) {
    console.error('Zoho People data fetch error:', error);

    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_people_data_access_failed',
      resource: 'Zoho People',
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Zoho People data. This could be due to missing refresh token or API permissions.',
      error: error.message
    });
  }
};

// Fetch Zoho CRM data (Sales - Contacts/Leads)
exports.getZohoCRMData = async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    const hasAccess = userRoles.some(role =>
      role.name === 'Admin' || role.zohoApp === 'Zoho CRM'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You need Sales role to access Zoho CRM data.'
      });
    }

    // Fetch contacts from Zoho CRM API
    const data = await makeZohoRequest('Zoho CRM', '/crm/v2/Contacts', 'GET');

    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_crm_data_access',
      resource: 'Zoho CRM',
      details: { endpoint: '/crm/v2/Contacts' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        app: 'Zoho CRM',
        records: data,
        message: 'CRM contacts fetched successfully'
      }
    });

  } catch (error) {
    console.error('Zoho CRM data fetch error:', error);

    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_crm_data_access_failed',
      resource: 'Zoho CRM',
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Zoho CRM data. This could be due to missing refresh token or API permissions.',
      error: error.message
    });
  }
};

// Fetch Zoho Desk data (Support - Tickets)
exports.getZohoDeskData = async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    const hasAccess = userRoles.some(role =>
      role.name === 'Admin' || role.zohoApp === 'Zoho Desk'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You need Support role to access Zoho Desk data.'
      });
    }

    // Fetch tickets from Zoho Desk API
    const data = await makeZohoRequest('Zoho Desk', '/api/v1/tickets', 'GET');

    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_desk_data_access',
      resource: 'Zoho Desk',
      details: { endpoint: '/api/v1/tickets' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        app: 'Zoho Desk',
        records: data,
        message: 'Support tickets fetched successfully'
      }
    });

  } catch (error) {
    console.error('Zoho Desk data fetch error:', error);

    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_desk_data_access_failed',
      resource: 'Zoho Desk',
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Zoho Desk data. This could be due to missing refresh token or API permissions.',
      error: error.message
    });
  }
};

// Fetch Zoho Books data (Finance - Invoices/Customers)
exports.getZohoBooksData = async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    const hasAccess = userRoles.some(role =>
      role.name === 'Admin' || role.zohoApp === 'Zoho Books'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You need Finance role to access Zoho Books data.'
      });
    }

    // Fetch customers from Zoho Books API
    const data = await makeZohoRequest('Zoho Books', '/books/v3/contacts', 'GET');

    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_books_data_access',
      resource: 'Zoho Books',
      details: { endpoint: '/books/v3/contacts' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        app: 'Zoho Books',
        records: data,
        message: 'Financial data fetched successfully'
      }
    });

  } catch (error) {
    console.error('Zoho Books data fetch error:', error);

    await AuditLog.create({
      userId: req.user.id,
      action: 'zoho_books_data_access_failed',
      resource: 'Zoho Books',
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Zoho Books data. This could be due to missing refresh token or API permissions.',
      error: error.message
    });
  }
};
