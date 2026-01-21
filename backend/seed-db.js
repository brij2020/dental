/**
 * Seed Database with Test Data
 * Run with: node seed-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./app/config/environment');
const Profile = require('./app/models/profile.model');
const Clinic = require('./app/models/clinic.model');

async function seedDatabase() {
  try {
    console.log('\n=== Seeding Database ===\n');
    console.log(`Environment: ${config.name}`);
    console.log(`MongoDB URI: ${config.mongodb_uri}\n`);

    // Connect to database
    await mongoose.connect(config.mongodb_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Create test clinic if it doesn't exist
    let clinic = await Clinic.findOne({ name: 'Test Clinic' });
    if (!clinic) {
      console.log('📌 Creating test clinic...');
      clinic = new Clinic({
        name: 'Test Clinic',
        address: '123 Dental Street',
        phone: '9876543210', // Valid Indian phone number format
        email: 'clinic@test.com',
        city: 'Test City',
        state: 'Test State',
        zip_code: '12345'
      });
      await clinic.save();
      console.log(`✅ Created clinic with ID: ${clinic._id}\n`);
    } else {
      console.log(`✅ Test clinic already exists: ${clinic._id}\n`);
    }

    // Create test users
    const testUsers = [
      {
        email: 'superadmin@test.com',
        password: 'admin00129',
        full_name: 'Super Admin',
        role: 'super_admin',
        clinic_id: clinic._id.toString(),
        mobile_number: '9876543210'
      },
      {
        email: 'doctor@test.com',
        password: 'doctor123',
        full_name: 'Dr. Test Doctor',
        role: 'doctor',
        clinic_id: clinic._id.toString(),
        mobile_number: '9876543211'
      },
      {
        email: 'receptionist@test.com',
        password: 'receptionist123',
        full_name: 'Test Receptionist',
        role: 'receptionist',
        clinic_id: clinic._id.toString(),
        mobile_number: '9876543212'
      }
    ];

    console.log('📌 Creating/Updating test users...\n');

    for (const userData of testUsers) {
      // Check if user exists
      const existing = await Profile.findOne({ email: userData.email });
      
      if (existing) {
        console.log(`ℹ️  User already exists: ${userData.email}`);
        
        // Update password if password field exists
        if (existing.password) {
          const passwordMatch = await bcrypt.compare(userData.password, existing.password);
          if (!passwordMatch) {
            console.log(`   ⚠️  Password doesn't match, updating...`);
            existing.password = userData.password;
            await existing.save();
            console.log(`   ✅ Password updated`);
          }
        } else {
          // If no password field, set one
          console.log(`   ⚠️  No password set, updating...`);
          existing.password = userData.password;
          await existing.save();
          console.log(`   ✅ Password updated`);
        }
      } else {
        console.log(`✅ Creating user: ${userData.email}`);
        const user = new Profile(userData);
        await user.save();
        console.log(`   ✅ Created with role: ${userData.role}`);
      }
    }

    console.log('\n=== Seed Complete ===\n');
    console.log('Test Credentials:');
    console.log('═════════════════════════════════════════════');
    testUsers.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
    });
    console.log('\n═════════════════════════════════════════════');
    console.log('\nLogin URL: http://localhost:8080/api/auth/login');
    console.log('Method: POST');
    console.log('Body: { "email": "superadmin@test.com", "password": "admin00129" }\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
