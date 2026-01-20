const mongoose = require("mongoose");

const remedySchema = new mongoose.Schema(
  {
    clinic_id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    times: {
      type: String,
      default: null,
      trim: true,
    },
    quantity: {
      type: String,
      default: null,
      trim: true,
    },
    days: {
      type: String,
      default: null,
      trim: true,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Compound unique index on clinic_id and name (one remedy name per clinic)
remedySchema.index({ clinic_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("remedy", remedySchema);
