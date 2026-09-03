const express = require('express');
const router = express.Router();
const zohoController = require('../controllers/zohoController');
const { authenticate } = require('../middlewares/auth');

// Protected routes - require authentication
router.get('/apps', authenticate, zohoController.getAuthorizedApps);
router.get('/apps/:appName/url', authenticate, zohoController.getAppAccessUrl);

// Zoho API proxy endpoints - fetch actual data from Zoho using backend credentials
router.get('/people/data', authenticate, zohoController.getZohoPeopleData);
router.get('/crm/data', authenticate, zohoController.getZohoCRMData);
router.get('/desk/data', authenticate, zohoController.getZohoDeskData);
router.get('/books/data', authenticate, zohoController.getZohoBooksData);

// OAuth setup routes (for initial configuration)
router.get('/oauth/authorize', zohoController.getOAuthUrl);
router.get('/oauth/callback', zohoController.handleOAuthCallback);

module.exports = router;
