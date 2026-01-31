const mongoose = require("mongoose");

const treatmentProcedureSchema = new mongoose.Schema(
  {
    consultation_id: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    clinic_id: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    tooth_number: {
      type: Number,
      required: true,
      min: 1,
      max: 52
    },
    tooth_damage: {
      type: String,
      default: "",
      trim: true
    },
    problems: {
      type: [String],
      default: []
    },
    solutions: {
      type: [String],
      default: []
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
treatmentProcedureSchema.index({ consultation_id: 1, tooth_number: 1 });
treatmentProcedureSchema.index({ clinic_id: 1, consultation_id: 1 });

module.exports = mongoose.model("TreatmentProcedure", treatmentProcedureSchema);
