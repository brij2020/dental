/**
 * Script to fix the duplicate key error in clinics collection
 * This removes all corrupted/stale indexes and ensures proper indexing
 */

const mongoose = require("mongoose");
const db = require("./app/config/db.config");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bezkoder_db";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const Clinic = require("./app/models").clinics;

    // Get all current indexes
    console.log("\n📋 Checking indexes on clinics collection...");
    const indexes = await Clinic.collection.getIndexes();
    console.log("Current indexes:", Object.keys(indexes));

    // List of stale/unwanted indexes to drop
    const stalIndexes = ["email_1", "registration_number_1", "license_number_1"];

    // Drop all stale indexes
    for (const indexName of stalIndexes) {
      if (indexes[indexName]) {
        console.log(`\n🔧 Dropping stale index: ${indexName}...`);
        try {
          await Clinic.collection.dropIndex(indexName);
          console.log(`✅ Dropped ${indexName} index`);
        } catch (err) {
          console.log(`⚠️  Could not drop ${indexName}: ${err.message}`);
        }
      }
    }

    // Drop existing clinic_id index to recreate it properly
    if (indexes.clinic_id_1) {
      console.log("\n🔧 Dropping existing clinic_id_1 index...");
      try {
        await Clinic.collection.dropIndex("clinic_id_1");
        console.log("✅ Dropped clinic_id_1 index");
      } catch (err) {
        console.log(`⚠️  Could not drop clinic_id_1: ${err.message}`);
      }
    }

    // Create proper sparse unique index for clinic_id
    console.log("\n🔧 Creating proper indexes...");
    await Clinic.collection.createIndex({ clinic_id: 1 }, { unique: true, sparse: true });
    console.log("✅ Created unique sparse index on clinic_id");

    console.log("\n📋 Final indexes:");
    const finalIndexes = await Clinic.collection.getIndexes();
    console.log(Object.keys(finalIndexes));

    console.log("\n✅ Database fix completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

connectDB();
