// backend/app/delete-superadmin.js
// Usage: node backend/app/delete-superadmin.js

const mongoose = require('mongoose');
const db = require('./models');
const Profile = db.profiles;

const MONGO_URI = 'mongodb://13.203.195.153:27017/bezkoder_db';

async function deleteSuperAdmin() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = 'superadmin@yopmail.com'; // Change if needed

  const result = await Profile.deleteOne({ email });
  if (result.deletedCount > 0) {
    console.log('Super admin deleted.');
  } else {
    console.log('Super admin not found.');
  }
  mongoose.disconnect();
}

deleteSuperAdmin().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
