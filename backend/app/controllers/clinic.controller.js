const { logger } = require("../config/logger");
const clinicService = require("../services/clinic.service");
const profileService = require("../services/profile.service");
const emailService = require('../services/email.service');
const fs = require('fs');
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
    const { parsePagination } = require("../utils/pagination");
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).send({
        message: pagination.error,
        code: pagination.code,
      });
    }

    const result = await clinicService.getAllClinics({
      page: pagination.hasPagination ? pagination.page : undefined,
      limit: pagination.hasPagination ? pagination.limit : undefined,
      search: req.query.search,
      city: req.query.city,
      status: req.query.status,
      created_from: req.query.created_from,
      created_to: req.query.created_to,
    });
    const clinics = Array.isArray(result) ? result : (result?.data || []);
    const paginationMeta = Array.isArray(result) ? undefined : result?.pagination;

    const payload = { data: clinics };
    if (paginationMeta) payload.pagination = paginationMeta;
    res.status(200).send(payload);
  } catch (err) {
    logger.error({ err }, "Error retrieving clinics");
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
 * Public clinic lookup by either Mongo _id or clinic_id
 */
exports.findPublicById = async (req, res) => {
  const id = req.params.id;
  try {
    // try by ObjectId-style id first
    try {
      const clinic = await clinicService.getClinicSelfId(id);
      return res.status(200).send(clinic);
    } catch (e) {
      // fallback to clinic_id lookup
    }

    const clinicByClinicId = await clinicService.getClinicById(id);
    return res.status(200).send(clinicByClinicId);
  } catch (err) {
    res.status(404).send({ message: err.message || 'Clinic not found' });
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
 * Upload clinic logo/profile image
 */
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No file uploaded"
      });
    }

    const clinicId = req.params.id || req.user?.clinic_id;
    if (!clinicId) {
      return res.status(400).send({
        success: false,
        message: "Clinic ID is required"
      });
    }

    const filename = req.file.filename;
    const logoUrl = `/uploads/clinics/${filename}`;

    const clinic = await clinicService.updateClinic(clinicId, {
      logo: logoUrl
    });

    return res.status(200).send({
      success: true,
      message: "Clinic logo uploaded successfully",
      data: {
        clinic,
        logo: logoUrl,
        filename
      }
    });
  } catch (err) {
    logger.error({ err }, 'Error uploading clinic logo');

    if (req.file?.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) logger.error({ err: unlinkErr }, 'Error deleting uploaded clinic logo after failure');
      });
    }

    return res.status(500).send({
      success: false,
      message: err.message || "Error uploading clinic logo"
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

/**
 * Clinic information endpoint by clinic_id
 * Returns clinic, admin_staff profile (if available) and list of doctors/admins
 */
exports.clinicInformation = async (req, res) => {
  try {
    const clinic_id = req.params.clinic_id || req.query.clinic_id;
    if (!clinic_id) {
      return res.status(400).send({ message: 'clinic_id is required' });
    }

    // Fetch clinic by clinic_id
    const clinic = await clinicService.getClinicById(clinic_id);

    // Fetch admin profile if admin_staff populated
    let adminProfile = null;
    try {
      if (clinic.admin_staff) {
        adminProfile = await profileService.getProfileById(clinic.admin_staff.toString());
      }
    } catch (err) {
      // ignore admin lookup errors
      logger.error({ err }, 'Failed to load admin profile for clinic-information');
    }

    // Fetch all profiles (doctors + admins) for this clinic
    let doctors = await profileService.getAllProfiles({ clinic_id });
    if(!doctors || doctors.length === 0){
      doctors = doctors.filter(profile =>  profile.role === 'admin'); 
    }
    console.log(doctors);
    return res.status(200).send({ clinic, admin: adminProfile, doctors });
  } catch (err) {
    res.status(500).send({ message: err.message || 'Error retrieving clinic information' });
  }
}
