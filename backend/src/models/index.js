const { sequelize } = require('../config/database');

// Import model definitions
const UserModel = require('./User');
const RoleModel = require('./Role');
const PermissionModel = require('./Permission');
const AuditLogModel = require('./AuditLog');

// Initialize models
const User = UserModel(sequelize);
const Role = RoleModel(sequelize);
const Permission = PermissionModel(sequelize);
const AuditLog = AuditLogModel(sequelize);

// Define associations

// User <-> Role (Many-to-Many)
User.belongsToMany(Role, {
  through: 'user_roles',
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles'
});

Role.belongsToMany(User, {
  through: 'user_roles',
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users'
});

// Role <-> Permission (Many-to-Many)
Role.belongsToMany(Permission, {
  through: 'role_permissions',
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: 'role_permissions',
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

// User -> AuditLog (One-to-Many)
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs'
});

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  AuditLog
};
