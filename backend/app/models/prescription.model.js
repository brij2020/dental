const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  consultation_id: { type: String, required: true, index: true },
  clinic_id: { type: String, required: true },
  medicine_name: { type: String, required: true },
  times: { type: String, default: null },
  quantity: { type: String, default: null },
  days: { type: String, default: null },
  note: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('prescription', prescriptionSchema);
