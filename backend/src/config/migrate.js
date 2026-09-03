const { sequelize, User, Role, Permission, AuditLog } = require('../models');

async function migrate() {
  try {
    console.log('Starting database migration...\n');

    // Test connection first
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    // Sync all models (creates tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✓ All tables created/updated successfully');

    // Create junction tables for many-to-many relationships
    console.log('\n✓ Junction tables (user_roles, role_permissions) created automatically by Sequelize');

    console.log('\n✓ Migration completed successfully!');
    console.log('\nNext step: Run "npm run seed" to populate initial data');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = migrate;
