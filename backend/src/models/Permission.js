const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Resource type (e.g., users, roles, zoho_apps)'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Action type (e.g., create, read, update, delete)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'permissions',
    timestamps: true
  });

  return Permission;
};
