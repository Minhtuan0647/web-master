require('dotenv').config();
const bcrypt = require('bcryptjs');
const { dbRun, dbGet } = require('./config/database');

async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rareparfume.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (adminPassword === 'admin123') {
      console.warn('⚠️  ADMIN_PASSWORD is using the default value. Please change it before deploying.');
    }

    if (adminPassword.length < 12) {
      console.warn('⚠️  ADMIN_PASSWORD should be at least 12 characters for better security.');
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Check if admin user already exists
    const existingUser = await dbGet(
      'SELECT id FROM admin_users WHERE email = ?',
      [adminEmail]
    );

    if (existingUser) {
      console.log(`✅ Admin user already exists with email: ${adminEmail}`);
      return;
    }

    // Insert admin user
    const result = await dbRun(
      `INSERT INTO admin_users (email, password_hash, name, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [adminEmail, passwordHash, 'Administrator', 'admin', 1]
    );

    console.log(`✅ Admin user created successfully!`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🆔 User ID: ${result.id}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
