const { logger } = require("../config/logger");
const clinicService = require("../services/clinic.service");

/**
 * Create Clinic
 */
exports.create = async (req, res) => {
  try {
    const result = await clinicService.createClinic(req.body);
    res.status(201).send(result);
  } catch (err) {
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
    const { id } = req.params;
    const clinic = await clinicService.updateClinic(id, req.body);
    res.status(200).send(clinic);
  } catch (err) {
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
