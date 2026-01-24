const mongoose = require("mongoose");

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid phone number"]
    },

    address: {
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      postal_code: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      }
    },

    clinic_id: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active"
    },

    logo: {
      type: String
    },

    branding_moto: {
      type: String,
      trim: true
    },

    location: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
      floor: String,
      room_number: String,
      wing: String
    },

    description: {
      type: String,
      trim: true
    },
    // Single admin/staff member associated with this clinic
    admin_staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile"
    },
    admin_staff_name: {
      type: String,
      default: null,
      trim: true,
      ref: "Profile",
      description: "Name of the admin staff member"
    },
    // Array of doctors associated with this clinic
    doctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile"
      }
    ],
  },
  {
    timestamps: true
  }
);

const Clinic = mongoose.model("Clinic", clinicSchema);

module.exports = Clinic;
