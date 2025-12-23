require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const readline = require('readline');
const { dbRun, dbGet } = require('./config/database');

// Generate a secure random password
function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one character from each category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Validate password strength
function validatePasswordStrength(password) {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters long` };
  }
  if (!hasUppercase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowercase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSymbols) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' };
  }
  
  return { valid: true };
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createSecureAdmin() {
  try {
    console.log('🔐 Creating Secure Admin Account\n');
    
    // Get email
    const email = await question('📧 Enter admin email (default: admin@rareparfume.com): ') || 'admin@rareparfume.com';
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('❌ Invalid email format');
      rl.close();
      process.exit(1);
    }
    
    // Get name
    const name = await question('👤 Enter admin name (default: Administrator): ') || 'Administrator';
    
    // Get role
    const roleInput = await question('👔 Enter role (admin/sale, default: admin): ') || 'admin';
    const role = ['admin', 'sale'].includes(roleInput.toLowerCase()) ? roleInput.toLowerCase() : 'admin';
    
    // Password options
    console.log('\n🔑 Password Options:');
    console.log('1. Generate secure random password (recommended)');
    console.log('2. Enter custom password');
    const passwordOption = await question('Choose option (1/2, default: 1): ') || '1';
    
    let password;
    if (passwordOption === '1') {
      const lengthInput = await question('Enter password length (12-32, default: 16): ') || '16';
      const length = Math.max(12, Math.min(32, parseInt(lengthInput) || 16));
      password = generateSecurePassword(length);
      console.log(`\n✅ Generated secure password: ${password}`);
      console.log('⚠️  IMPORTANT: Save this password securely! It will not be shown again.\n');
    } else {
      password = await question('Enter password (min 12 chars, must include uppercase, lowercase, number, symbol): ');
      const validation = validatePasswordStrength(password);
      if (!validation.valid) {
        console.error(`❌ ${validation.message}`);
        rl.close();
        process.exit(1);
      }
    }
    
    // Hash the password with 12 rounds (recommended for production)
    console.log('\n🔒 Hashing password with bcrypt (12 rounds)...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if admin user already exists
    const existingUser = await dbGet(
      'SELECT id, email, name, role FROM admin_users WHERE email = ?',
      [email]
    );
    
    if (existingUser) {
      console.log(`\n⚠️  Admin user already exists with email: ${email}`);
      const update = await question('Do you want to update the password? (y/n, default: n): ') || 'n';
      
      if (update.toLowerCase() === 'y') {
        const result = await dbRun(
          'UPDATE admin_users SET password_hash = ?, name = ?, role = ?, is_active = 1 WHERE email = ?',
          [passwordHash, name, role, email]
        );
        
        if (result.changes > 0) {
          console.log('\n✅ Admin password updated successfully!');
          console.log(`📧 Email: ${email}`);
          console.log(`👤 Name: ${name}`);
          console.log(`👔 Role: ${role}`);
          console.log(`🔑 Password: ${password}`);
          console.log(`\n⚠️  IMPORTANT: Save these credentials securely!`);
        } else {
          console.log('❌ Failed to update admin user');
        }
      } else {
        console.log('Operation cancelled.');
      }
    } else {
      // Insert new admin user
      const result = await dbRun(
        `INSERT INTO admin_users (email, password_hash, name, role, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [email, passwordHash, name, role, 1]
      );
      
      console.log('\n✅ Admin user created successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Name: ${name}`);
      console.log(`👔 Role: ${role}`);
      console.log(`🆔 User ID: ${result.lastID}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`\n⚠️  IMPORTANT: Save these credentials securely!`);
    }
    
    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

// Run the script
createSecureAdmin();

