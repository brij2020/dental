/**
 * Create Super Admin User
 * Run with: node create-superadmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./app/config/environment');
const Profile = require('./app/models/profile.model');

async function createSuperAdmin() {
  try {
    console.log('\n=== Creating Super Admin ===\n');
    console.log(`Environment: ${config.name}`);
    console.log(`MongoDB URI: ${config.mongodb_uri}\n`);

    // Connect to database
    await mongoose.connect(config.mongodb_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    const superAdminData = {
      email: 'superadmin@test.com',
      mobile_number: '9876543210',
      full_name: 'Super Admin',
      role: 'super_admin',
      clinic_id: '697b9b667f9bea4786fa8833',
      status: 'Active',
      slot_duration_minutes: 15,
      education: [],
      password: '$2b$10$cBA9md2hW9cD4zuMOtcKWOAFdIb5XYdoi0H7kvB0Cv.CDtE6SUJ8q', // This is already hashed
      capacity: '1x',
      availability: [
        {
          day: 'Monday',
          start_time: '09:00',
          end_time: '18:00',
          is_available: true
        },
        {
          day: 'Tuesday',
          start_time: '09:00',
          end_time: '18:00',
          is_available: true
        },
        {
          day: 'Wednesday',
          start_time: '09:00',
          end_time: '18:00',
          is_available: true
        },
        {
          day: 'Thursday',
          start_time: '09:00',
          end_time: '18:00',
          is_available: true
        },
        {
          day: 'Friday',
          start_time: '09:00',
          end_time: '18:00',
          is_available: true
        },
        {
          day: 'Saturday',
          start_time: '09:00',
          end_time: '14:00',
          is_available: true
        },
        {
          day: 'Sunday',
          start_time: '00:00',
          end_time: '00:00',
          is_available: false
        }
      ],
      leave: []
    };

    // Check if super admin already exists
    const existing = await Profile.findOne({ email: superAdminData.email });

    if (existing) {
      console.log('📌 Super admin already exists. Updating...\n');
      
      // Update with new data
      Object.assign(existing, superAdminData);
      existing.password = superAdminData.password; // Keep the hashed password
      await existing.save();
      
      console.log('✅ Super admin updated successfully!\n');
      console.log('Details:');
      console.log(`  Email: ${existing.email}`);
      console.log(`  Name: ${existing.full_name}`);
      console.log(`  Role: ${existing.role}`);
      console.log(`  Clinic ID: ${existing.clinic_id}`);
      console.log(`  Status: ${existing.status}`);
      console.log(`  Slot Duration: ${existing.slot_duration_minutes} minutes`);
      console.log(`  Capacity: ${existing.capacity}`);
      console.log(`  Availability Days: ${existing.availability.length}`);
    } else {
      console.log('📌 Creating new super admin...\n');
      
      const superAdmin = new Profile(superAdminData);
      await superAdmin.save();
      
      console.log('✅ Super admin created successfully!\n');
      console.log('Details:');
      console.log(`  Email: ${superAdmin.email}`);
      console.log(`  Name: ${superAdmin.full_name}`);
      console.log(`  Role: ${superAdmin.role}`);
      console.log(`  Clinic ID: ${superAdmin.clinic_id}`);
      console.log(`  Status: ${superAdmin.status}`);
      console.log(`  Slot Duration: ${superAdmin.slot_duration_minutes} minutes`);
      console.log(`  Capacity: ${superAdmin.capacity}`);
      console.log(`  Availability Days: ${superAdmin.availability.length}`);
      console.log(`  ID: ${superAdmin._id}`);
    }

    console.log('\n=== Process Complete ===\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createSuperAdmin();
