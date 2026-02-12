const { logger } = require("../config/logger");
const profileService = require("../services/profile.service");
const fs = require("fs");

/**
 * Create Doctor Profile (HTTP handler)
 */
exports.create = async (req, res) => {
  try {
    const data = await profileService.createProfile(req.body);
    res.status(201).send(data);
  } catch (err) {
    // Mongoose validation errors and duplicate key errors should be treated as client errors (4xx)
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message, errors: err.errors });
    }

    // Mongo duplicate key error (E11000)
    if (err.code === 11000) {
      const key = err.keyValue ? Object.keys(err.keyValue)[0] : null;
      const value = err.keyValue ? err.keyValue[key] : undefined;
      const friendly = key === 'email' ? 'Email already exists' : key === 'mobile_number' ? 'Mobile number already exists' : `Duplicate value for ${key}`;
      return res.status(409).send({ message: friendly, key, value });
    }

    res.status(500).send({ message: err.message || "Error creating doctor profile" });
  }
};

/**
 * Admin reset another user's password.
 * Body: { admin_current_password, new_password }
 */
exports.adminResetPassword = async (req, res) => {
  try {
    const targetId = req.params.id;
    const adminId = req.user && req.user.id;
    const { admin_current_password, new_password } = req.body;

    if (!adminId) return res.status(401).send({ message: 'Unauthorized' });

    const result = await profileService.adminResetPassword(targetId, adminId, admin_current_password, new_password);
    res.send({ message: result.message });
  } catch (err) {
    if (err.name === 'AuthError') return res.status(401).send({ message: err.message });
    if (err.name === 'NotFound') return res.status(404).send({ message: err.message });
    if (err.name === 'ValidationError') return res.status(400).send({ message: err.message, errors: err.errors });
    res.status(500).send({ message: err.message || 'Error resetting password' });
  }
};

/**
 * Get all doctors
 */
exports.findAll = async (req, res) => {
  try {
  
    const doctors = await profileService.getAllProfiles({clinic_id: req.user.clinic_id, ...req.query});
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(doctors);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving doctors"
    });
  }
};

/**
 * Public: Get all doctor/admin profiles (optional filters)
 */
exports.findAllPublic = async (req, res) => {
  try {
    const { clinic_id, status, full_name } = req.query || {};
    const doctors = await profileService.getAllProfiles({
      role: { $in: ['doctor', 'admin'] }
    });
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message, errors: err.errors });
    }

    if (err.code === 11000) {
      const key = err.keyValue ? Object.keys(err.keyValue)[0] : null;
      const value = err.keyValue ? err.keyValue[key] : undefined;
      const friendly = key === 'email' ? 'Email already exists' : key === 'mobile_number' ? 'Mobile number already exists' : `Duplicate value for ${key}`;
      return res.status(409).send({ message: friendly, key, value });
    }

    res.status(500).send({ message: err.message || "Error updating doctor profile" });
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
    const availabilityType = req.query.consultation_type || 'in_person';
    const slots = await profileService.getProfileSlots(id, availabilityType);
    
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

/**
 * Upload profile picture
 */
exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No file uploaded"
      });
    }

    const profileId = req.params.id;
    if (!profileId) {
      return res.status(400).send({
        success: false,
        message: "Profile ID is required"
      });
    }

    const filename = req.file.filename;
    const profilePicUrl = `/uploads/profiles/${filename}`;

    const updated = await profileService.updateProfile(profileId, {
      profile_pic: profilePicUrl
    });

    return res.status(200).send({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profile: updated,
        profile_pic: profilePicUrl,
        filename
      }
    });
  } catch (err) {
    logger.error({ err }, "Error uploading profile picture");

    if (req.file?.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) logger.error({ err: unlinkErr }, "Error deleting uploaded profile image after failure");
      });
    }

    return res.status(500).send({
      success: false,
      message: err.message || "Error uploading profile picture"
    });
  }
};
