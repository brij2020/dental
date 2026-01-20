const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");
console.log("Defining ProfileArchive schema");
const profileArchiveSchema = new mongoose.Schema(
  {
    // Original profile ID
    original_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    mobile_number: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"]
    },

    full_name: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.DOCTOR
    },

    clinic_id: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },

    availability: {
      type: Object,
      default: {}
    },

    leave: [
      {
        day: {
          type: String,
          required: true
        },
        date: {
          type: String,
          required: true
        },
      }
    ],

    slot_duration_minutes: {
      type: Number,
      default: 15
    },

    profile_pic: {
      type: String
    },

    education: {
      type: [String]
    },

    years_of_experience: {
      type: Number
    },

    specialization: {
      type: [String]
    },

    bio: {
      type: String
    },

    password: {
      type: String,
      select: false
    },

    // Archive-specific fields
    archived_at: {
      type: Date,
      default: Date.now
    },

    archived_by: {
      type: String
    },

    archive_reason: {
      type: String
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = mongoose.model("ProfileArchive", profileArchiveSchema);
