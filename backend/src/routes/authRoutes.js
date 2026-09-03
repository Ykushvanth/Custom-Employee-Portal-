const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.post('/register', authController.registerValidation, authController.register);
router.post('/login', authController.loginValidation, authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
