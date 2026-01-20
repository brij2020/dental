const mongoose = require("mongoose");

const medicalConditionSchema = new mongoose.Schema(
  {
    clinic_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
      description: "Reference to the clinic"
    },
    name: {
      type: String,
      required: true,
      trim: true,
      description: "Name of the medical condition (e.g., Gingivitis, Fever)"
    },
    has_value: {
      type: Boolean,
      default: false,
      description: "Whether this condition requires an input value (e.g., 102F, 120/80)"
    },
    is_active: {
      type: Boolean,
      default: true,
      description: "Whether this condition is active"
    },
    description: {
      type: String,
      trim: true,
      default: null,
      description: "Optional description of the condition"
    }
     ,
     sar: {
       type: String,
       trim: true,
       default: null,
       description: "SAR field for the medical condition (optional)"
     }
  },
  {
    timestamps: true,
    collection: "medical_conditions"
  }
);

// Compound unique index: clinic_id + name
medicalConditionSchema.index(
  { clinic_id: 1, name: 1 },
  { unique: true, sparse: true, collation: { locale: "en", strength: 2 } }
);

// Index for faster queries
medicalConditionSchema.index({ clinic_id: 1, is_active: 1 });

module.exports = mongoose.model("MedicalCondition", medicalConditionSchema);
