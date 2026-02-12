const mongoose = require("mongoose");

const chiefComplaintSchema = new mongoose.Schema(
  {
    clinic_id: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

chiefComplaintSchema.index({ clinic_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("ChiefComplaint", chiefComplaintSchema);
