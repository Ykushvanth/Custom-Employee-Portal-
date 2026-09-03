const { Sequelize } = require('sequelize');
const dns = require('dns');
require('dotenv').config();

// Force IPv4 DNS resolution globally
dns.setDefaultResultOrder('ipv4first');

// Parse DATABASE_URL to extract connection details
let sequelizeConfig;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

try {
  const dbUrl = new URL(process.env.DATABASE_URL);

  sequelizeConfig = {
    dialect: 'postgres',
    host: dbUrl.hostname,
    port: dbUrl.port || 5432,
    database: dbUrl.pathname.slice(1),
    username: dbUrl.username,
    password: dbUrl.password,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
} catch (error) {
  console.error('❌ Invalid DATABASE_URL format:', error.message);
  process.exit(1);
}

const sequelize = new Sequelize(sequelizeConfig);

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
