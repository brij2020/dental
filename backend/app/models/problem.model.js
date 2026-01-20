const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    clinic_id: {
      type: String,
      required: true,
      ref: "Clinic",
      index: true
    },
    clinical_findings: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ["Mild", "Moderate", "Severe", "Critical"],
      default: "Moderate"
    },
    brief_description: {
      type: String,
      required: true,
      trim: true
    },
    treatment_plan: {
      type: String,
      required: true,
      trim: true
    },
    icd10_code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    notes: {
      type: String,
      trim: true,
      default: null
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

// Index for clinic_id for faster queries
problemSchema.index({ clinic_id: 1 });

module.exports = mongoose.model("Problem", problemSchema);
