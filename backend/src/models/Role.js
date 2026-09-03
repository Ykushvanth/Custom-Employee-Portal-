const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isIn: [['Admin', 'HR', 'Sales', 'Support', 'Finance']]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    zohoApp: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Zoho application this role has access to'
    }
  }, {
    tableName: 'roles',
    timestamps: true
  });

  return Role;
};
