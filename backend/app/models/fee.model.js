const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  clinic_id: { type: String, required: true, unique: true, index: true },
  cost_fees: { type: Number, required: true, min: 0 },
  gst_number: { type: String, trim: true },
  note: { type: String, trim: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("fee", feeSchema);
