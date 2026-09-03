const { User, Role, AuditLog } = require('../models');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Get all users with their roles
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
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
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, roleIds = [] } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      isActive: true
    });

    // Assign roles if provided
    if (roleIds.length > 0) {
      const roles = await Role.findAll({ where: { id: roleIds } });
      await user.addRoles(roles);
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'user_created',
      resource: 'users',
      details: { createdUserId: user.id, email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Fetch user with roles
    const createdUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: createdUser }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, isActive, password, roleIds } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (password) user.password = password;

    await user.save();

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      const roles = await Role.findAll({ where: { id: roleIds } });
      await user.setRoles(roles);
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'user_updated',
      resource: 'users',
      details: { updatedUserId: id, rolesUpdated: !!roleIds },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    const updatedUser = await User.findByPk(id, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'user_deleted',
      resource: 'users',
      details: { deletedUserId: id, email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Assign role to user
exports.assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    await user.addRole(role);

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'role_assigned',
      resource: 'users',
      details: { userId: id, roleId, roleName: role.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: `Role ${role.name} assigned successfully`
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role',
      error: error.message
    });
  }
};

// Remove role from user
exports.removeRole = async (req, res) => {
  try {
    const { id, roleId } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    await user.removeRole(role);

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'role_removed',
      resource: 'users',
      details: { userId: id, roleId, roleName: role.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: `Role ${role.name} removed successfully`
    });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove role',
      error: error.message
    });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (userId) whereClause.userId = userId;
    if (action) whereClause.action = action;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

// Get system statistics
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const totalRoles = await Role.count();

    const usersByRole = await Role.findAll({
      include: [{
        model: User,
        as: 'users',
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        [require('sequelize').fn('COUNT', require('sequelize').col('users.id')), 'userCount']
      ],
      group: ['Role.id', 'Role.name']
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalRoles,
        usersByRole
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description', 'zohoApp'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

// Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const { Permission } = require('../models');

    const permissions = await Permission.findAll({
      order: [['resource', 'ASC'], ['action', 'ASC']]
    });

    res.json({
      success: true,
      data: { permissions }
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: error.message
    });
  }
};

// Get permissions for a specific role
exports.getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { Permission } = require('../models');

    const role = await Role.findByPk(roleId, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions
        }
      }
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions',
      error: error.message
    });
  }
};

// Add permission to role
exports.addPermissionToRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    const { Permission } = require('../models');

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if already assigned
    const hasPermission = await role.hasPermission(permission);
    if (hasPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission already assigned to this role'
      });
    }

    await role.addPermission(permission);

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'permission_added',
      resource: 'roles',
      details: {
        roleId,
        roleName: role.name,
        permissionId,
        permissionName: permission.name
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: `Permission "${permission.name}" added to role "${role.name}"`
    });
  } catch (error) {
    console.error('Add permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add permission',
      error: error.message
    });
  }
};

// Remove permission from role
exports.removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    const { Permission } = require('../models');

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    await role.removePermission(permission);

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'permission_removed',
      resource: 'roles',
      details: {
        roleId,
        roleName: role.name,
        permissionId,
        permissionName: permission.name
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: `Permission "${permission.name}" removed from role "${role.name}"`
    });
  } catch (error) {
    console.error('Remove permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove permission',
      error: error.message
    });
  }
};
