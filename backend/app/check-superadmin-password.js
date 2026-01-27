// backend/app/check-superadmin-password.js
// Usage: node backend/app/check-superadmin-password.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const db = require('./models');
const Profile = db.profiles;

const MONGO_URI = 'mongodb://13.203.195.153:27017/bezkoder_db';

async function checkSuperAdminPassword() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = 'superadmin@yopmail.com'; // Change if needed
  const plainPassword = 'adminnews24'; // Change if needed

  const user = await Profile.findOne({ email }).select('+password');
  if (!user) {
    console.log('Super admin not found.');
    mongoose.disconnect();
    return;
  }

  const isMatch = await bcrypt.compare(plainPassword, user.password);
  console.log('Password hash in DB:', user.password);
  if (isMatch) {
    console.log('Password matches!');
  } else {
    console.log('Password does NOT match!');
  }
  mongoose.disconnect();
}

checkSuperAdminPassword().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
