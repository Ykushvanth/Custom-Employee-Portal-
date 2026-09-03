const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Action performed (e.g., login, logout, role_change, zoho_access)'
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Resource affected by action'
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional details about the action'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'success',
      validate: {
        isIn: [['success', 'failure', 'error']]
      }
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false
  });

  return AuditLog;
};
