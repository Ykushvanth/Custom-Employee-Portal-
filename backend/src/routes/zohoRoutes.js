const express = require('express');
const router = express.Router();
const zohoController = require('../controllers/zohoController');
const { authenticate } = require('../middlewares/auth');

// Protected routes - require authentication
router.get('/apps', authenticate, zohoController.getAuthorizedApps);
router.get('/apps/:appName/url', authenticate, zohoController.getAppAccessUrl);

// OAuth setup routes (for initial configuration)
router.get('/oauth/authorize', zohoController.getOAuthUrl);
router.get('/oauth/callback', zohoController.handleOAuthCallback);

module.exports = router;
