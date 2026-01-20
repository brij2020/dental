const mongoose = require("mongoose");

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
      trim: true
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
 * Pre-save hook to auto-generate UHID if not provided
 * Format: CLINIC_ID/YY/SEQUENCE (e.g., APO/24/000001) for clinic registrations
 * Format: GLOBAL/YY/SEQUENCE (e.g., GLOBAL/24/000001) for global registrations
 */
patientSchema.pre("save", async function (next) {
  // Only generate UHID if not already provided
  if (!this.uhid) {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      
      // Determine the prefix based on registration type
      let prefix = "GLOBAL";
      let query = { registration_type: this.registration_type };

      if (this.registration_type === "clinic" && this.clinic_id) {
        prefix = this.clinic_id;
        query.clinic_id = this.clinic_id;
      }
      
      // Get the count of patients for this type/clinic to generate sequence
      const count = await mongoose.model("Patient").countDocuments(query);
      
      // Generate sequence (pad with zeros to 6 digits)
      const sequence = String(count + 1).padStart(6, "0");
      
      // Format: PREFIX/YY/SEQUENCE
      this.uhid = `${prefix}/${currentYear}/${sequence}`;
      
    } catch (error) {
      console.error("Error generating UHID:", error);
      return next(error);
    }
  }
  
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
