const { logger } = require("../config/logger");
const clinicService = require("../services/clinic.service");
const emailService = require('../services/email.service');
/**
 * Create Clinic
 */
exports.create = async (req, res) => {
  try {
    const result = await clinicService.createClinic(req.body);
    // Send provisional login credentials email
    
    const clinicEmail = req.body?.adminProfile?.email;
    const clinicName = req.body?.name;
    const username = req.body?.adminProfile?.username || clinicEmail;
    const password = req.body?.adminProfile?.password || 'provisional-password';
    if (clinicEmail) {
      try {
        await emailService.sendClinicCredentials(clinicEmail, clinicName, username, password);
      } catch (emailErr) {
        // Log but don't fail clinic creation
        logger.error('Failed to send clinic credentials email:', emailErr);
      }
    }
    res.status(201).send(result);
  } catch (err) {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({
      message: err.message || "Error creating clinic"
    });
  }
};

/**
 * Get all clinics
 */
exports.findAll = async (req, res) => {
  try {
    const clinics = await clinicService.getAllClinics();
    res.status(200).send(clinics);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving clinics"
    });
  }
};

/**
 * Get all active clinics
 */
exports.findAllActive = async (req, res) => {
  try {
    const clinics = await clinicService.getActiveClinics();
    res.status(200).send(clinics);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving active clinics"
    });
  }
};

/**
 * Search clinics by name, state, city, pin, and location
 */
exports.search = async (req, res) => {
  try {
    const { name, state, city, pin, location } = req.query;
    const clinics = await clinicService.searchClinics({
      name,
      state,
      city,
      pin,
      location
    });
    res.status(200).send(clinics);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error searching clinics"
    });
  }
};

/**
 * Get a single clinic by id
 */
exports.findOne = async (req, res) => {
  try {
    const clinic = await clinicService.getClinicById(req.user.clinic_id);
    res.status(200).send(clinic);
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error retrieving clinic"
    });
  }
};


exports.findById = async (req, res) => {
  try {
    const clinic = await clinicService.getClinicSelfId(req.params.id);
    res.status(200).send(clinic);
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error retrieving clinic"
    });
  }
}   

/**
 * Get a single clinic by id
 */
exports.findOne = async (req, res) => {
  try {
    const clinic = await clinicService.getClinicById(req.user.clinic_id);
    res.status(200).send(clinic);
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error retrieving clinic"
    });
  }
};

/**
 * Update clinic by id
 */
exports.update = async (req, res) => {
  try {
    const clinicId = req.params.id || req.user.clinic_id;
    if (!clinicId) {
      return res.status(400).send({
        message: "Clinic ID is required"
      });
    }
    const clinic = await clinicService.updateClinic(clinicId, req.body);
    res.status(200).send(clinic);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({
      message: err.message || "Error updating clinic"
    });
  }
};

/**
 * Delete clinic by id
 */
exports.delete = async (req, res) => {
  try {
    await clinicService.deleteClinic(req.params.id);
    res.status(200).send({
      message: "Clinic deleted successfully"
    });
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error deleting clinic"
    });
  }
};

/**
 * Get admin/staff schedules for a clinic
 */
exports.getAdminSchedules = async (req, res) => {
  try {
    const clinicId = req.params.id;
    if (!clinicId) {
      return res.status(400).send({
        message: "Clinic ID is required"
      });
    }
    const adminSchedules = await clinicService.getAdminSchedules(clinicId);
    res.status(200).send(adminSchedules);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving admin schedules"
    });
  }
};

/**
 * Get doctor schedules for a clinic
 */
exports.getDoctorSchedules = async (req, res) => {
  try {
    const clinicId = req.params.id;
    if (!clinicId) {
      return res.status(400).send({
        message: "Clinic ID is required"
      });
    }
    const doctorSchedules = await clinicService.getDoctorSchedules(clinicId);
    res.status(200).send(doctorSchedules);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving doctor schedules"
    });
  }
};

/**
 * Get specific doctor schedule by doctor ID
 */
exports.getDoctorScheduleById = async (req, res) => {
  try {
    const { id: clinicId, doctorId } = req.params;
    if (!clinicId || !doctorId) {
      return res.status(400).send({
        message: "Clinic ID and Doctor ID are required"
      });
    }
    const doctorSchedule = await clinicService.getDoctorScheduleById(clinicId, doctorId);
    res.status(200).send(doctorSchedule);
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error retrieving doctor schedule"
    });
  }
};
