const mongoose = require("mongoose");

const clinicPanelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    clinic_id: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    specialization: {
      type: String,
      enum: [
        "General Dentistry",
        "Pediatric Dentistry",
        "Orthodontics",
        "Periodontics",
        "Prosthodontics",
        "Endodontics",
        "Oral Surgery",
        "Implantology",
        "Cosmetic Dentistry",
        "Other"
      ]
    },
    is_active: {
      type: Boolean,
      default: true
    },
    dentist_ids: {
      type: [String],
      default: []
    },
    facilities: {
      type: [String],
      default: []
    },
    treatment_types: {
      type: [String],
      default: []
    },
    max_daily_appointments: {
      type: Number,
      default: 20
    },
    appointment_duration_minutes: {
      type: Number,
      default: 30
    },
    opening_time: {
      type: String,
      default: "09:00"
    },
    closing_time: {
      type: String,
      default: "18:00"
    },
    break_time: {
      start: {
        type: String
      },
      end: {
        type: String
      }
    },
    working_days: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    holidays: {
      type: [Date],
      default: []
    },
    contact_number: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid phone number"]
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    location: {
      floor: String,
      room_number: String,
      wing: String
    },
    pricing: {
      consultation_fee: {
        type: Number
      },
      currency: {
        type: String,
        default: "INR"
      }
    },
    notes: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance"],
      default: "Active"
    }
  },
  {
    timestamps: true,
    collection: "clinic_panels"
  }
);

// Indexes for faster queries
clinicPanelSchema.index({ clinic_id: 1 });
clinicPanelSchema.index({ code: 1 });
clinicPanelSchema.index({ name: 1 });
clinicPanelSchema.index({ clinic_id: 1, code: 1 }, { unique: true });
clinicPanelSchema.index({ is_active: 1 });
clinicPanelSchema.index({ specialization: 1 });

const ClinicPanel = mongoose.model("ClinicPanel", clinicPanelSchema);

module.exports = ClinicPanel;
