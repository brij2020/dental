const mongoose = require("mongoose");

const procedureSchema = new mongoose.Schema(
  {
    clinic_id: {
      type: String,
      required: true,
      ref: "Clinic"
    },
    panel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClinicPanel",
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    procedure_type: {
      type: String,
      enum: ["General", "Cosmetic", "Surgical", "Diagnostic", "Preventive", "Restorative", "Orthodontic", "Prosthodontic", "Periodontal", "Endodontic", "Other"],
      default: "General"
    },
    description: {
      type: String,
      trim: true
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
    },
    note: {
      type: String,
      trim: true
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
procedureSchema.index({ clinic_id: 1 });
procedureSchema.index({ panel_id: 1 });

module.exports = mongoose.model("Procedure", procedureSchema);
