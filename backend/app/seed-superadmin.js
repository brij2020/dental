const mongoose = require('mongoose');

const db = require('./models');
const Profile = db.profiles;

const MONGO_URI = 'mongodb://13.203.195.153:27017/bezkoder_db'; // Corrected URI

async function createSuperAdmin() {


    db.mongoose
        .connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(() => {
            console.log('Connected to the database!');
        })
        .catch(err => {
            console.log({ err }, 'Cannot connect to the database!');
            process.exit();
        });

    const email = 'superadmin@yopmail.com'; 
    const password = 'adminnews24'; 
    const full_name = 'Super Admin';
    const role = 'super_admin';

    const existing = await Profile.findOne({ email });
    if (existing) {
        console.log('Super admin already exists.');
        mongoose.disconnect();
        return;
    }


    const user = new Profile({
        email,
        password, // Save as plain text, pre-save hook will hash
        full_name,
        role,
        clinic_id: "system",
        status: "Active",
        mobile_number: "6127934258"
    });

    await user.save();
    console.log('Super admin created!');
    mongoose.disconnect();
}

createSuperAdmin().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
