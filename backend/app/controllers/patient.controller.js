const { logger } = require("../config/logger");
const patientService = require("../services/patient.service");

/**
 * Create a new patient (Clinic or Global)
 * Can be called by clinic staff or admin panel
 */
exports.create = async (req, res) => {
  try {
    const { clinic_id, registration_type = "clinic", ...patientData } = req.body;

    // Validate required fields
    if (!patientData.full_name) {
      return res.status(400).send({
        message: "full_name is required"
      });
    }

    // Validate registration type
    if (!["clinic", "global"].includes(registration_type)) {
      return res.status(400).send({
        message: "registration_type must be 'clinic' or 'global'"
      });
    }

    // For clinic registration, clinic_id is required
    if (registration_type === "clinic" && !clinic_id) {
      return res.status(400).send({
        message: "clinic_id is required for clinic registration"
      });
    }

    const newPatient = {
      ...patientData,
      registration_type,
      clinic_id: registration_type === "clinic" ? clinic_id : null
      // UHID will be auto-generated if not provided
    };

    const patient = await patientService.createPatient(newPatient);
    res.status(201).send({
      message: "Patient created successfully",
      data: patient
    });
  } catch (err) {
    logger.error(`Error creating patient: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error creating patient"
    });
  }
};

/**
 * Get all patients (Clinic-specific or Global)
 */
exports.findAll = async (req, res) => {
  try {
    // For clinic staff: show only their clinic's patients
    // For admin: show all patients or filter by clinic if specified
    const clinicId = req.user?.clinic_id || req.query.clinic_id;
    const registrationType = req.query.registration_type; // Optional filter

    let filters = {
      search: req.query.search,
      gender: req.query.gender,
      state: req.query.state,
      city: req.query.city,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      registration_type: registrationType
    };

    // If user is a clinic staff, only show their clinic's patients
    if (clinicId && !req.user?.role?.includes("admin")) {
      filters.clinic_id = clinicId;
      filters.registration_type = "clinic";
    } else if (clinicId && req.query.registration_type === "clinic") {
      // Admin filtering by specific clinic
      filters.clinic_id = clinicId;
      filters.registration_type = "clinic";
    }

    const result = await patientService.getAllPatients(filters);
    res.send(result);
  } catch (err) {
    logger.error(`Error retrieving patients: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving patients"
    });
  }
};

/**
 * Get patient by ID
 */
exports.findOne = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await patientService.getPatientById(patientId);

    res.send({
      data: patient
    });
  } catch (err) {
    logger.error(`Error retrieving patient: ${err.message}`);
    res.status(404).send({
      message: err.message || "Patient not found"
    });
  }
};

/**
 * Get patient by UHID
 */
exports.findByUhid = async (req, res) => {
  try {
    const { uhid } = req.params;

    const patient = await patientService.getPatientByUhid(uhid);
    res.send({
      data: patient
    });
  } catch (err) {
    logger.error(`Error retrieving patient by UHID: ${err.message}`);
    res.status(404).send({
      message: err.message || "Patient not found"
    });
  }
};

/**
 * Get patient by email
 */
exports.findByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const patient = await patientService.getPatientByEmail(email);

    if (!patient) {
      return res.status(404).send({
        message: "Patient not found"
      });
    }

    res.send({
      data: patient
    });
  } catch (err) {
    logger.error(`Error retrieving patient by email: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving patient"
    });
  }
};

/**
 * Get patients by phone number
 */
exports.findByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).send({
        message: "Phone number is required"
      });
    }

    const patients = await patientService.getPatientsByPhone(phone);

    res.send({
      data: patients || []
    });
  } catch (err) {
    logger.error(`Error retrieving patient by phone: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving patient"
    });
  }
};

/**
 * Update patient
 */
exports.update = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send({
        message: "Data to update cannot be empty"
      });
    }

    const patientId = req.params.id;
    const patient = await patientService.updatePatient(patientId, req.body);

    res.send({
      message: "Patient updated successfully",
      data: patient
    });
  } catch (err) {
    logger.error(`Error updating patient: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error updating patient"
    });
  }
};

/**
 * Delete patient
 */
exports.delete = async (req, res) => {
  try {
    const patientId = req.params.id;
    await patientService.deletePatient(patientId);

    res.send({
      message: "Patient deleted successfully"
    });
  } catch (err) {
    logger.error(`Error deleting patient: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error deleting patient"
    });
  }
};

/**
 * Bulk delete patients
 */
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({
        message: "ids array is required and must not be empty"
      });
    }

    const result = await patientService.bulkDeletePatients(ids);

    res.send({
      message: `${result.deletedCount} patients deleted successfully`,
      data: result
    });
  } catch (err) {
    logger.error(`Error bulk deleting patients: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error deleting patients"
    });
  }
};

/**
 * Check if patient exists
 */
exports.checkExists = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({
        message: "email is required"
      });
    }

    const exists = await patientService.patientExists(email);

    res.send({
      exists
    });
  } catch (err) {
    logger.error(`Error checking patient existence: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error checking patient"
    });
  }
};
