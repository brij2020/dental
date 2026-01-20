const { logger } = require("../config/logger");
const Patient = require("../models/patient.model");
const generateUhid  = require("../util/generateUhid");
/**
 * Create a new patient
 */
exports.createPatient = async (patientData) => {
  try {
    const patient = new Patient(patientData);
    const savedPatient = await patient.save();
    logger.info(`Patient created: ${savedPatient._id}`);
    return savedPatient;
  } catch (error) {
    logger.error(`Error creating patient: ${error.message}`);
    throw error;
  }
};

/**
 * Get all patients with filters (supports both clinic and global)
 */
exports.getAllPatients = async (filters = {}) => {
  try {
    const query = {};

    // Add optional filters
    if (filters.search) {
      query.$or = [
        { full_name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { contact_number: { $regex: filters.search, $options: "i" } },
        { uhid: { $regex: filters.search, $options: "i" } }
      ];
    }

    if (filters.gender) {
      query.gender = filters.gender;
    }

    if (filters.state) {
      query.state = filters.state;
    }

    if (filters.city) {
      query.city = filters.city;
    }

    // Filter by clinic if specified
    if (filters.clinic_id) {
      query.clinic_id = filters.clinic_id;
    }

    // Filter by registration type if specified
    if (filters.registration_type) {
      query.registration_type = filters.registration_type;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const patients = await Patient.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    const total = await Patient.countDocuments(query);

    return {
      data: patients,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error retrieving patients: ${error.message}`);
    throw error;
  }
};

/**
 * Get patient by ID
 */
exports.getPatientById = async (patientId) => {
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }
    return patient;
  } catch (error) {
    logger.error(`Error retrieving patient: ${error.message}`);
    throw error;
  }
};

/**
 * Get patient by UHID (works for both clinic and global patients)
 */
exports.getPatientByUhid = async (uhid) => {
  try {
    const patient = await Patient.findOne({ uhid });
    if (!patient) {
      throw new Error("Patient not found");
    }
    return patient;
  } catch (error) {
    logger.error(`Error retrieving patient by UHID: ${error.message}`);
    throw error;
  }
};

/**
 * Get patient by email (works for both clinic and global patients)
 */
exports.getPatientByEmail = async (email) => {
  try {
    const patient = await Patient.findOne({
      email: { $regex: `^${email}$`, $options: "i" }
    });
    return patient;
  } catch (error) {
    logger.error(`Error retrieving patient by email: ${error.message}`);
    throw error;
  }
};

/**
 * Get patients by phone number (can return multiple results)
 */
exports.getPatientsByPhone = async (phone) => {
  try {
    // Clean the phone number - remove spaces, dashes, etc.
    const cleanedPhone = phone.replace(/[\s\-+()]/g, '');
    
    // Search for patients with matching phone number (partial match)
    const patients = await Patient.find({
      contact_number: { $regex: cleanedPhone, $options: "i" }
    }).limit(10);
    
    return patients;
  } catch (error) {
    logger.error(`Error retrieving patients by phone: ${error.message}`);
    throw error;
  }
};

/**
 * Update patient
 */
exports.updatePatient = async (patientId, updateData) => {
  try {
    const patient = await Patient.findByIdAndUpdate(patientId, updateData, {
      new: true,
      runValidators: true
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    logger.info(`Patient updated: ${patientId}`);
    return patient;
  } catch (error) {
    logger.error(`Error updating patient: ${error.message}`);
    throw error;
  }
};

/**
 * Delete patient
 */
exports.deletePatient = async (patientId) => {
  try {
    const patient = await Patient.findByIdAndDelete(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }
    logger.info(`Patient deleted: ${patientId}`);
    return patient;
  } catch (error) {
    logger.error(`Error deleting patient: ${error.message}`);
    throw error;
  }
};

/**
 * Bulk delete patients
 */
exports.bulkDeletePatients = async (patientIds) => {
  try {
    const result = await Patient.deleteMany({ _id: { $in: patientIds } });
    logger.info(`${result.deletedCount} patients deleted`);
    return result;
  } catch (error) {
    logger.error(`Error bulk deleting patients: ${error.message}`);
    throw error;
  }
};

/**
 * Check if patient exists by email (works for both clinic and global patients)
 */
exports.patientExists = async (email) => {
  try {
    const patient = await Patient.findOne({
      email: { $regex: `^${email}$`, $options: "i" }
    });
    return !!patient;
  } catch (error) {
    logger.error(`Error checking patient existence: ${error.message}`);
    throw error;
  }
};
