const { User, Role, AuditLog } = require('../models');
const { generateToken } = require('../utils/jwt');
const { body, validationResult } = require('express-validator');

// Validation rules for registration
exports.registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
];

// Validation rules for login
exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      isActive: true
    });

    // Log registration
    await AuditLog.create({
      userId: user.id,
      action: 'user_registered',
      resource: 'users',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please contact admin to assign role.',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }]
    });

    if (!user) {
      await AuditLog.create({
        userId: null,
        action: 'login_failed',
        resource: 'auth',
        details: { email, reason: 'User not found' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failure'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await AuditLog.create({
        userId: user.id,
        action: 'login_failed',
        resource: 'auth',
        details: { email, reason: 'Account inactive' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failure'
      });

      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      await AuditLog.create({
        userId: user.id,
        action: 'login_failed',
        resource: 'auth',
        details: { email, reason: 'Invalid password' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failure'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token (only contains user ID)
    const token = generateToken(user.id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await AuditLog.create({
      userId: user.id,
      action: 'login_success',
      resource: 'auth',
      details: { email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles.map(role => ({
            id: role.id,
            name: role.name,
            zohoApp: role.zohoApp
          }))
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};
