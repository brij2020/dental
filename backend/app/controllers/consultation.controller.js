const consultationService = require("../services/consultation.service");
const { logger } = require("../config/logger");

/**
 * Create a new consultation
 */
exports.create = async (req, res) => {
  try {
    const consultation = await consultationService.createConsultation(req.body);
    res.status(201).send({ success: true, data: consultation });
  } catch (err) {
    logger.error({ err }, 'Error in create consultation controller');
    if (err.message.includes('already exists')) {
      return res.status(409).send({ message: err.message });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error creating consultation" });
  }
};

/**
 * Get consultation by ID
 */
exports.findById = async (req, res) => {
  try {
    const consultation = await consultationService.getConsultationById(req.params.id);
    res.status(200).send({ success: true, data: consultation });
  } catch (err) {
    logger.error({ err }, 'Error in findById consultation controller');
    if (err.message === "Consultation not found") {
      return res.status(404).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error retrieving consultation" });
  }
};

/**
 * Get consultation by appointment ID
 */
exports.findByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId || String(appointmentId).trim() === '' || ['undefined', 'null'].includes(String(appointmentId))) {
      logger.warn({ appointmentId, ip: req.ip }, 'Invalid appointmentId provided to findByAppointmentId');
      return res.status(400).send({ success: false, message: 'Invalid appointmentId' });
    }

    const consultation = await consultationService.getConsultationByAppointmentId(appointmentId);
    if (!consultation) {
      return res.status(404).send({ message: "Consultation not found for this appointment" });
    }
    res.status(200).send({ success: true, data: consultation });
  } catch (err) {
    logger.error({ err }, 'Error in findByAppointmentId consultation controller');
    res.status(500).send({ message: err.message || "Error retrieving consultation" });
  }
};

/**
 * Get or create consultation by appointment ID
 */
exports.getOrCreate = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId || String(appointmentId).trim() === '' || ['undefined', 'null'].includes(String(appointmentId))) {
      logger.warn({ appointmentId, ip: req.ip }, 'Invalid appointmentId provided to getOrCreate');
      return res.status(400).send({ success: false, message: 'Invalid appointmentId' });
    }

    const consultation = await consultationService.getOrCreateConsultation(appointmentId, req.body);
    res.status(200).send({ success: true, data: consultation });
  } catch (err) {
    logger.error({ err }, 'Error in getOrCreate consultation controller');
    res.status(500).send({ message: err.message || "Error getting or creating consultation" });
  }
};

/**
 * Update consultation
 */
exports.update = async (req, res) => {
  try {
    const consultation = await consultationService.updateConsultation(req.params.id, req.body);
    res.status(200).send({ success: true, data: consultation });
  } catch (err) {
    logger.error({ err }, 'Error in update consultation controller');
    if (err.message === "Consultation not found") {
      return res.status(404).send({ message: err.message });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error updating consultation" });
  }
};

/**
 * Get all consultations by clinic ID
 */
exports.findByClinicId = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const filters = {
      status: req.query.status,
      patient_id: req.query.patient_id,
      doctor_id: req.query.doctor_id,
      limit: parseInt(req.query.limit) || 100,
      skip: parseInt(req.query.skip) || 0
    };
    const consultations = await consultationService.getConsultationsByClinicId(clinicId, filters);
    res.status(200).send({ success: true, data: consultations });
  } catch (err) {
    logger.error({ err }, 'Error in findByClinicId consultation controller');
    res.status(500).send({ message: err.message || "Error retrieving consultations" });
  }
};

/**
 * Get all consultations by patient ID
 */
exports.findByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const filters = {
      status: req.query.status,
      clinic_id: req.query.clinic_id,
      limit: parseInt(req.query.limit) || 100,
      skip: parseInt(req.query.skip) || 0
    };
    const consultations = await consultationService.getConsultationsByPatientId(patientId, filters);
    res.status(200).send({ success: true, data: consultations });
  } catch (err) {
    logger.error({ err }, 'Error in findByPatientId consultation controller');
    res.status(500).send({ message: err.message || "Error retrieving consultations" });
  }
};

/**
 * Delete consultation
 */
exports.delete = async (req, res) => {
  try {
    await consultationService.deleteConsultation(req.params.id);
    res.status(200).send({ success: true, message: "Consultation deleted successfully" });
  } catch (err) {
    logger.error({ err }, 'Error in delete consultation controller');
    if (err.message === "Consultation not found") {
      return res.status(404).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error deleting consultation" });
  }
};
