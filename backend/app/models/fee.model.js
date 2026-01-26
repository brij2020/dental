const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  clinic_id: { type: String, required: true,},
  doctor_id: { type: String, required: false, default: null, index: true, unique:true }, // Optional: null for clinic-wide fee
  cost_fees: { type: Number, required: true, min: 0 },
  gst_number: { type: String, trim: true },
  note: { type: String, trim: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Compound unique index: one fee per clinic+doctor combination
// Sparse index allows multiple nulls, so we'll handle clinic-wide fee uniqueness in the service layer
feeSchema.index({ doctor_id: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("fee", feeSchema);
