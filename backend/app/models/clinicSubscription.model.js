const mongoose = require("mongoose");

const clinicSubscriptionSchema = new mongoose.Schema(
  {
    clinic_id: {
      type: String,
      required: true,
      index: true,
    },
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
      index: true,
    },
    purchased_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    name_snapshot: {
      type: String,
      required: true,
    },
    price_snapshot: {
      type: Number,
      required: true,
    },
    currency_snapshot: {
      type: String,
      required: true,
    },
    features_snapshot: {
      type: [String],
      default: [],
    },
    limits_snapshot: {
      max_doctors: { type: Number, default: 0 },
      max_staff: { type: Number, default: 0 },
      max_branches: { type: Number, default: 0 },
      max_appointments: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ClinicSubscription", clinicSubscriptionSchema);
