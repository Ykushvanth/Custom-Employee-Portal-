const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL || (() => {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

  if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error('Database configuration is missing. Set DATABASE_URL or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD.');
  }

  return `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT || 5432}/${DB_NAME}`;
})();

const connectionUrl = process.env.DB_HOST
  ? `postgresql://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`
  : databaseUrl;

// Prefer the pooler configuration when it is supplied because it supports IPv4 networks.
const sequelize = new Sequelize(connectionUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Force IPv4 connection to avoid IPv6 timeout issues.
    family: 4,
    connectionTimeoutMillis: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('✗ Unable to connect to database:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
