/**
 * Script to test authentication and verify test user
 * Run with: node test-auth.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./app/config/environment');
const Profile = require('./app/models/profile.model');

async function testAuth() {
  try {
    console.log('\n=== Authentication Test ===\n');
    console.log(`Environment: ${config.name}`);
    console.log(`MongoDB URI: ${config.mongodb_uri}\n`);

    // Connect to database
    await mongoose.connect(config.mongodb_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Check if test user exists
    const testEmail = 'superadmin@test.com';
    const testPassword = 'admin00129';

    console.log(`Checking for user: ${testEmail}`);
    const user = await Profile.findOne({ email: testEmail.toLowerCase().trim() }).select('+password');

    if (!user) {
      console.log('❌ User NOT found in database\n');
      
      // Show all users
      console.log('📋 All users in database:');
      const allUsers = await Profile.find({}, 'email full_name role').lean();
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.full_name}) - Role: ${u.role}`);
      });

      console.log('\n💡 To create test user, run:');
      console.log(`
const bcrypt = require('bcryptjs');
const testUser = new Profile({
  email: "${testEmail}",
  password: "${testPassword}",
  full_name: "Super Admin",
  clinic_id: "test-clinic",
  role: "admin"
});
await testUser.save();
      `);
    } else {
      console.log('✅ User found in database');
      console.log(`   Email: ${user.email}`);
      console.log(`   Full Name: ${user.full_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);

      // Test password verification
      console.log(`\n🔐 Testing password verification...`);
      console.log(`   Testing password: "${testPassword}"`);
      
      const isMatch = await bcrypt.compare(testPassword, user.password);
      
      if (isMatch) {
        console.log('   ✅ Password matches!');
      } else {
        console.log('   ❌ Password does NOT match');
        
        // Try hashing the provided password to see what it should be
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`   💡 Current password hash in DB: ${user.password}`);
        console.log(`   💡 What it should be (new hash): ${newHash}`);
        
        console.log('\n   To fix: Update password in database');
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Test complete\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAuth();
