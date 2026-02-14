const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    duration_days: {
      type: Number,
      required: true,
      min: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    limits: {
      max_doctors: { type: Number, default: 0 },
      max_staff: { type: Number, default: 0 },
      max_branches: { type: Number, default: 0 },
      max_appointments: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    scope: {
      type: String,
      enum: ["global", "clinic"],
      default: "global",
    },
    clinic_id: {
      type: String,
      trim: true,
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    created_by_role: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
