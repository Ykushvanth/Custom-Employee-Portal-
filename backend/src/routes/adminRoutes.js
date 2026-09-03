const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');

// All admin routes require authentication and Admin role
router.use(authenticate);
router.use(requireAdmin);

// User management
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Role management
router.get('/roles', userController.getAllRoles);

// Role assignment
router.post('/users/:id/roles', userController.assignRole);
router.delete('/users/:id/roles/:roleId', userController.removeRole);

// Audit logs
router.get('/audit-logs', userController.getAuditLogs);

// System stats
router.get('/stats', userController.getSystemStats);

// Permission management
router.get('/permissions', userController.getAllPermissions);
router.get('/roles/:roleId/permissions', userController.getRolePermissions);
router.post('/roles/:roleId/permissions', userController.addPermissionToRole);
router.delete('/roles/:roleId/permissions/:permissionId', userController.removePermissionFromRole);

module.exports = router;
