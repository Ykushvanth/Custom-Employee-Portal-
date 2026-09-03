const axios = require('axios');
require('dotenv').config();

const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.in';

// In-memory cache for access token
let accessTokenCache = {
  token: null,
  expiresAt: null
};

// Get valid Zoho access token (cached or fetch new)
const getAccessToken = async () => {
  try {
    // Check if cached token is still valid
    if (accessTokenCache.token && accessTokenCache.expiresAt > Date.now()) {
      console.log('Using cached Zoho access token');
      return accessTokenCache.token;
    }

    // Check if refresh token is configured
    if (!process.env.ZOHO_REFRESH_TOKEN) {
      throw new Error('ZOHO_REFRESH_TOKEN is not configured in .env file. Please follow the OAuth setup process.');
    }

    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET) {
      throw new Error('ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET is missing in .env file.');
    }

    // Fetch new access token using refresh token
    console.log('Fetching new Zoho access token...');
    const response = await axios.post(ZOHO_TOKEN_URL, null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    });

    const { access_token, expires_in } = response.data;

    // Validate that we actually got a token
    if (!access_token) {
      console.error('Zoho API response:', JSON.stringify(response.data, null, 2));
      throw new Error('No access_token in Zoho API response. Check your refresh token validity.');
    }

    // Cache the token (expires_in is in seconds, subtract 5 minutes for safety)
    accessTokenCache = {
      token: access_token,
      expiresAt: Date.now() + ((expires_in - 300) * 1000)
    };

    console.log('✅ Zoho access token obtained successfully');
    return access_token;

  } catch (error) {
    console.error('❌ Failed to get Zoho access token:', error.response?.data || error.message);
    throw new Error(error.message || 'Zoho authentication failed');
  }
};

// Get Zoho app URL based on app name
const getZohoAppUrl = (appName) => {
  const urls = {
    'Zoho People': process.env.ZOHO_PEOPLE_URL || 'https://people.zoho.com',
    'Zoho CRM': process.env.ZOHO_CRM_URL || 'https://crm.zoho.com',
    'Zoho Desk': process.env.ZOHO_DESK_URL || 'https://desk.zoho.com',
    'Zoho Books': process.env.ZOHO_BOOKS_URL || 'https://books.zoho.com'
  };

  return urls[appName] || null;
};

// Make authenticated request to Zoho API
const makeZohoRequest = async (appName, endpoint = '', method = 'GET', data = null) => {
  try {
    const accessToken = await getAccessToken();
    const baseUrl = getZohoAppUrl(appName);

    if (!baseUrl) {
      throw new Error(`Invalid Zoho app: ${appName}`);
    }

    const url = endpoint ? `${baseUrl}${endpoint}` : baseUrl;

    const config = {
      method,
      url,
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;

  } catch (error) {
    console.error('Zoho API request failed:', error.response?.data || error.message);
    throw error;
  }
};

// Generate Zoho OAuth authorization URL (for initial setup)
// const getAuthorizationUrl = () => {
//   // Using simplified scopes that are more universally available
//   // You can customize these based on what's available in your Zoho API Console
//   const params = new URLSearchParams({
//     scope: 'ZohoCRM.modules.ALL,ZohoBooks.fullaccess.ALL',
//     client_id: process.env.ZOHO_CLIENT_ID,
//     response_type: 'code',
//     redirect_uri: process.env.ZOHO_REDIRECT_URI,
//     access_type: 'offline',
//     prompt: 'consent'
//   });

//   return `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params.toString()}`;
// };

const getAuthorizationUrl = () => {
  const params = new URLSearchParams({
    // Try different scope variations for Desk and People
    scope: 'ZohoCRM.modules.ALL,ZohoBooks.fullaccess.ALL,Desk.tickets.READ,Desk.tickets.CREATE,ZohoPeople.forms.READ',
    client_id: process.env.ZOHO_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.ZOHO_REDIRECT_URI,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params.toString()}`;
};

// Exchange authorization code for refresh token (one-time setup)
const exchangeCodeForTokens = async (code) => {
  try {
    const response = await axios.post(ZOHO_TOKEN_URL, null, {
      params: {
        code,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        redirect_uri: process.env.ZOHO_REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    });

    return response.data;

  } catch (error) {
    console.error('Failed to exchange code for tokens:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  getAccessToken,
  getZohoAppUrl,
  makeZohoRequest,
  getAuthorizationUrl,
  exchangeCodeForTokens
};
