const { sequelize, User, Role, Permission } = require('../models');

async function seed() {
  try {
    console.log('Starting database seeding...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    // Create Roles with Zoho app mappings
    console.log('\nCreating roles...');
    const roles = await Role.bulkCreate([
      {
        name: 'Admin',
        description: 'Full system access including user management and audit logs',
        zohoApp: null
      },
      {
        name: 'HR',
        description: 'Access to Zoho People for HR management',
        zohoApp: 'Zoho People'
      },
      {
        name: 'Sales',
        description: 'Access to Zoho CRM for sales operations',
        zohoApp: 'Zoho CRM'
      },
      {
        name: 'Support',
        description: 'Access to Zoho Desk for customer support',
        zohoApp: 'Zoho Desk'
      },
      {
        name: 'Finance',
        description: 'Access to Zoho Books for financial management',
        zohoApp: 'Zoho Books'
      }
    ]);
    console.log(`✓ Created ${roles.length} roles`);

    // Create Permissions
    console.log('\nCreating permissions...');
    const permissions = await Permission.bulkCreate([
      // User management permissions
      { name: 'view_users', resource: 'users', action: 'read', description: 'View user list' },
      { name: 'create_users', resource: 'users', action: 'create', description: 'Create new users' },
      { name: 'update_users', resource: 'users', action: 'update', description: 'Update user details' },
      { name: 'delete_users', resource: 'users', action: 'delete', description: 'Delete users' },

      // Role management permissions
      { name: 'view_roles', resource: 'roles', action: 'read', description: 'View roles' },
      { name: 'assign_roles', resource: 'roles', action: 'update', description: 'Assign roles to users' },

      // Zoho app access permissions
      { name: 'access_zoho_people', resource: 'zoho_apps', action: 'read', description: 'Access Zoho People' },
      { name: 'access_zoho_crm', resource: 'zoho_apps', action: 'read', description: 'Access Zoho CRM' },
      { name: 'access_zoho_desk', resource: 'zoho_apps', action: 'read', description: 'Access Zoho Desk' },
      { name: 'access_zoho_books', resource: 'zoho_apps', action: 'read', description: 'Access Zoho Books' },

      // Audit log permissions
      { name: 'view_audit_logs', resource: 'audit_logs', action: 'read', description: 'View audit logs' }
    ]);
    console.log(`✓ Created ${permissions.length} permissions`);

    // Assign permissions to roles
    console.log('\nAssigning permissions to roles...');

    // Admin - All permissions
    const adminRole = roles.find(r => r.name === 'Admin');
    await adminRole.addPermissions(permissions);

    // HR - HR specific permissions
    const hrRole = roles.find(r => r.name === 'HR');
    const hrPerms = permissions.filter(p =>
      p.name === 'view_users' ||
      p.name === 'view_roles' ||
      p.name === 'access_zoho_people'
    );
    await hrRole.addPermissions(hrPerms);

    // Sales - Sales specific permissions
    const salesRole = roles.find(r => r.name === 'Sales');
    const salesPerms = permissions.filter(p => p.name === 'access_zoho_crm');
    await salesRole.addPermissions(salesPerms);

    // Support - Support specific permissions
    const supportRole = roles.find(r => r.name === 'Support');
    const supportPerms = permissions.filter(p => p.name === 'access_zoho_desk');
    await supportRole.addPermissions(supportPerms);

    // Finance - Finance specific permissions
    const financeRole = roles.find(r => r.name === 'Finance');
    const financePerms = permissions.filter(p => p.name === 'access_zoho_books');
    await financeRole.addPermissions(financePerms);

    console.log('✓ Permissions assigned to roles');

    // Create default admin user
    console.log('\nCreating default admin user...');
    const adminUser = await User.create({
      email: 'admin@company.com',
      password: 'Admin@123',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true
    });
    await adminUser.addRole(adminRole);
    console.log('✓ Admin user created (email: admin@company.com, password: Admin@123)');

    // Create sample users for each role
    console.log('\nCreating sample users...');

    const hrUser = await User.create({
      email: 'hr@company.com',
      password: 'Hr@123',
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: true
    });
    await hrUser.addRole(hrRole);

    const salesUser = await User.create({
      email: 'sales@company.com',
      password: 'Sales@123',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true
    });
    await salesUser.addRole(salesRole);

    const supportUser = await User.create({
      email: 'support@company.com',
      password: 'Support@123',
      firstName: 'Alice',
      lastName: 'Johnson',
      isActive: true
    });
    await supportUser.addRole(supportRole);

    const financeUser = await User.create({
      email: 'finance@company.com',
      password: 'Finance@123',
      firstName: 'Bob',
      lastName: 'Williams',
      isActive: true
    });
    await financeUser.addRole(financeRole);

    console.log('✓ Sample users created for testing');

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('  Admin: admin@company.com / Admin@123');
    console.log('  HR: hr@company.com / Hr@123');
    console.log('  Sales: sales@company.com / Sales@123');
    console.log('  Support: support@company.com / Support@123');
    console.log('  Finance: finance@company.com / Finance@123');

  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seeding
if (require.main === module) {
  seed();
}

module.exports = seed;
