const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const patientSchema = new mongoose.Schema(
  {
    uhid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true
    },
    password: {
      type: String,
      select: false,
      description: "Hashed password for patient login"
    },
    full_name: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      enum: ["male", "female", "other","prefer not to say"],
      trim: true
    },
    contact_number: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"]
    },
    date_of_birth: {
      type: Date
    },
    address: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
    },
    avatar: {
      type: String,
      default: null
    },
    panel: {
      type: String,
      trim: true
    },
    clinic_id: {
      type: String,
      default: null
    },
    registration_type: {
      type: String,
      enum: ["clinic", "global"],
      default: "global",
      description: "clinic = registered via clinic, global = registered from main admin panel"
    }
  },
  {
    timestamps: true,
    collection: "patients"
  }
);

// Index for faster queries
patientSchema.index({ clinic_id: 1 });
patientSchema.index({ uhid: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ full_name: 1 });
patientSchema.index({ registration_type: 1 });

/**
 * Hash password before saving
 */
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 */
patientSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


/**
 * Pre-save hook to auto-generate UHID if not provided
 * Format: <YY><8-digit sequence> (e.g., 2600000001 for first patient in 2026)
 */
patientSchema.pre("save", async function (next) {
  if (!this.uhid) {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      // Count all patients for this year (global sequence)
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const count = await mongoose.model("Patient").countDocuments({ createdAt: { $gte: yearStart } });
      // 8-digit sequence, incremented
      const sequence = String(count + 1).padStart(8, "0");
      this.uhid = `${currentYear}${sequence}`;
    } catch (error) {
      console.error("Error generating UHID:", error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
