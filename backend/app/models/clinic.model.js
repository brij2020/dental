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
      floor: String,
      room_number: String,
      wing: String
    },

    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Clinic = mongoose.model("Clinic", clinicSchema);

module.exports = Clinic;
