const Prescription = require('../models/prescription.model');

// GET /api/prescriptions?consultation_id=...
exports.findByConsultationId = async (req, res) => {
  try {
    const { consultation_id } = req.query;
    if (!consultation_id) return res.status(400).send({ message: 'consultation_id is required' });
    const prescriptions = await Prescription.find({ consultation_id });
    res.status(200).send({ success: true, data: prescriptions });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// POST /api/prescriptions/bulk
exports.saveForConsultation = async (req, res) => {
  try {
    const { consultation_id, prescriptions } = req.body;
    if (!consultation_id || !Array.isArray(prescriptions)) {
      return res.status(400).send({ message: 'consultation_id and prescriptions array are required' });
    }
    // Remove existing prescriptions for this consultation
    await Prescription.deleteMany({ consultation_id });
    // Insert new prescriptions
    const inserted = await Prescription.insertMany(prescriptions.map(p => ({ ...p, consultation_id })));
    res.status(200).send({ success: true, data: inserted });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// DELETE /api/prescriptions?consultation_id=...
exports.deleteByConsultationId = async (req, res) => {
  try {
    const { consultation_id } = req.query;
    if (!consultation_id) return res.status(400).send({ message: 'consultation_id is required' });
    await Prescription.deleteMany({ consultation_id });
    res.status(200).send({ success: true, message: 'Prescriptions deleted' });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
