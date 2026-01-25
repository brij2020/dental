const { logger } = require("../config/logger");
const profileService = require("../services/profile.service");

/**
 * Create Doctor Profile (HTTP handler)
 */
exports.create = async (req, res) => {
  try {
    const data = await profileService.createProfile(req.body);
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error creating doctor profile"
    });
  }
};

/**
 * Get all doctors
 */
exports.findAll = async (req, res) => {
  try {
    const doctors = await profileService.getAllProfiles({clinic_id: req.user.clinic_id});
    res.send(doctors);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving doctors"
    });
  }
};

/**
 * Get doctor by ID
 */
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const doctor = await profileService.getProfileById(id);
    res.send(doctor);
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error retrieving doctor"
    });
  }
};

/**
 * Update doctor profile
 */
exports.update = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send({
        message: "Data to update cannot be empty"
      });
    }

    const id = req.params.id;
    const updated = await profileService.updateProfile(id, req.body);

    res.send({
      message: "Doctor profile updated successfully",
      data: updated
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating doctor profile"
    });
  }
};

/**
 * Delete doctor profile
 */
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await profileService.deleteProfile(id);

    res.send({
      message: "Doctor profile deleted successfully"
    });
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error deleting doctor profile"
    });
  }
};

/**
 * Get only active doctors
 */
exports.findAllActive = async (req, res) => {
  try {
    const doctors = await profileService.getActiveProfiles();
    res.send(doctors);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving active doctors"
    });
  }
};

/**
 * Get profiles by clinic ID
 */
exports.findByClinic = async (req, res) => {
  try {
    const clinicId = req.params.clinicId;
    if (!clinicId) {
      return res.status(400).send({
        message: "Clinic ID is required"
      });
    }

    const doctors = await profileService.getAllProfiles({ 
      clinic_id: clinicId,
      role: { $in: ['admin', 'doctor'] }
    });
    res.send(doctors);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving doctors for clinic"
    });
  }
};

/**
 * Get doctor slots (availability and slot duration)
 */
exports.getSlots = async (req, res) => {
  try {
    const id = req.params.id;
    const slots = await profileService.getProfileSlots(id);
    
    res.send({
      message: "Doctor slots retrieved successfully",
      data: slots
    });
  } catch (err) {
    res.status(404).send({
      message: err.message || "Error retrieving doctor slots"
    });
  }
};
