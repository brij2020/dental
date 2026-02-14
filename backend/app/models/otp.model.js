const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobile_number: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      default: "login",
      trim: true,
    },
    otp_hash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

otpSchema.index({ mobile_number: 1, purpose: 1 }, { unique: true });

module.exports = mongoose.model("Otp", otpSchema);
