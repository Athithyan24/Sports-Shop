const bcrypt = require('bcryptjs');
// Check this path! It should point to where User.js is relative to this file.
const User = require('./models/User'); 

const createAdmin = async () => {
  try {
    // 1. Check if an admin already exists
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('⚡ Admin user already exists. Skipping seed.');
      return; // 👈 We use 'return' here so the server keeps running!
    }

    // 2. Hash the password securely
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 3. Create the new admin user
    await User.create({
      name: 'System Admin',
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Success! Admin account created.');
    console.log('👉 Username: admin | Password: admin123');
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
  // 👈 Notice we completely removed the 'finally { process.exit(0); }' block.
};

// Export the function so server.js can use it
module.exports = createAdmin;