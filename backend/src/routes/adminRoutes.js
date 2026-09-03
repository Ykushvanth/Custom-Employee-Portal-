const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission, requireAdmin } = require('../middlewares/rbac');

// All admin routes require authentication
router.use(authenticate);

// User management - permission-based access
router.get('/users', requirePermission('view_users'), userController.getAllUsers);
router.get('/users/:id', requirePermission('view_users'), userController.getUserById);
router.post('/users', requirePermission('create_users'), userController.createUser);
router.put('/users/:id', requirePermission('update_users'), userController.updateUser);
router.delete('/users/:id', requirePermission('delete_users'), userController.deleteUser);

// Role management - permission-based access
router.get('/roles', requirePermission('view_roles'), userController.getAllRoles);

// Role assignment - permission-based access
router.post('/users/:id/roles', requirePermission('assign_roles'), userController.assignRole);
router.delete('/users/:id/roles/:roleId', requirePermission('assign_roles'), userController.removeRole);

// Audit logs - permission-based access
router.get('/audit-logs', requirePermission('view_audit_logs'), userController.getAuditLogs);

// System stats - Admin only (no specific permission for this)
router.get('/stats', requireAdmin, userController.getSystemStats);

// Permission management - Admin only (managing permissions is admin-only)
router.get('/permissions', requireAdmin, userController.getAllPermissions);
router.get('/roles/:roleId/permissions', requireAdmin, userController.getRolePermissions);
router.post('/roles/:roleId/permissions', requireAdmin, userController.addPermissionToRole);
router.delete('/roles/:roleId/permissions/:permissionId', requireAdmin, userController.removePermissionFromRole);

module.exports = router;
