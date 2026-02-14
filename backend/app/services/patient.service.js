const { logger } = require("../config/logger");
const Patient = require("../models/patient.model");
const Appointment = require("../models/appointment.model");
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
const parseDateOnly = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const escapeRegex = (value) => {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

exports.getAllPatients = async (filters = {}) => {
  try {
    const query = {};

    // Add optional filters
    if (filters.search) {
      const searchValue = String(filters.search).trim();
      if (searchValue.length > 0) {
        const regex = new RegExp(escapeRegex(searchValue), "i");
        const orClauses = [
          { full_name: { $regex: regex } },
          { email: { $regex: regex } },
          { contact_number: { $regex: regex } },
          { uhid: { $regex: regex } },
        ];

        const parsedDate = parseDateOnly(searchValue);
        if (parsedDate) {
          const upperBound = new Date(parsedDate);
          upperBound.setHours(23, 59, 59, 999);
          orClauses.push({
            date_of_birth: { $gte: parsedDate, $lte: upperBound },
          });
        }

        const numericAge = Number(searchValue);
        if (!Number.isNaN(numericAge) && numericAge >= 0 && numericAge <= 120) {
          const today = new Date();
          const start = new Date(today);
          start.setFullYear(start.getFullYear() - numericAge - 1);
          start.setHours(0, 0, 0, 0);
          const end = new Date(today);
          end.setFullYear(end.getFullYear() - numericAge);
          end.setHours(23, 59, 59, 999);
          orClauses.push({
            date_of_birth: { $gte: start, $lte: end },
          });
        }

        query.$or = orClauses;
      }
    }

    if (filters.gender) {
      query.gender = filters.gender;
    }

    if (filters.name) {
      query.full_name = { $regex: filters.name, $options: "i" };
    }

    if (filters.dob) {
      const dobDate = parseDateOnly(filters.dob);
      if (dobDate) {
        const start = new Date(dobDate);
        const end = new Date(dobDate);
        end.setHours(23, 59, 59, 999);
        query.date_of_birth = { $gte: start, $lte: end };
      } else {
        query.date_of_birth = { $regex: filters.dob, $options: "i" };
      }
    }

    if (filters.uhid) {
      query.uhid = { $regex: filters.uhid, $options: "i" };
    }

    if (filters.contact_number) {
      query.contact_number = { $regex: filters.contact_number, $options: "i" };
    }

    if (filters.registered_from || filters.registered_to) {
      const createdAtFilter = {};
      if (filters.registered_from) {
        const fromDate = parseDateOnly(filters.registered_from);
        if (fromDate) {
          createdAtFilter.$gte = fromDate;
        }
      }
      if (filters.registered_to) {
        const toDate = parseDateOnly(filters.registered_to);
        if (toDate) {
          const endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
          createdAtFilter.$lte = endDate;
        }
      }
      if (Object.keys(createdAtFilter).length > 0) {
        query.createdAt = createdAtFilter;
      }
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

exports.getClinicRelatedPatients = async (filters = {}) => {
  try {
    const clinicId = filters.clinic_id;
    if (!clinicId) {
      throw new Error("clinic_id is required");
    }

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;
    const skip = (page - 1) * limit;

    const appointmentPipeline = [
      {
        $match: {
          clinic_id: clinicId,
          file_number: { $exists: true, $ne: null }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$patient_id",
          file_number: { $first: "$file_number" },
          visitedAt: { $first: "$createdAt" }
        }
      }
    ];

    const appointmentRecords = await Appointment.aggregate(appointmentPipeline);
    const appointmentPatientIds = appointmentRecords
      .map((record) => (record._id ? String(record._id) : null))
      .filter(Boolean);

    const fileNumberByPatientId = new Map(
      appointmentRecords.map((record) => [String(record._id), record.file_number || null])
    );

    const baseConditions = [
      { clinic_id: clinicId, registration_type: "clinic" }
    ];

    if (appointmentPatientIds.length > 0) {
      baseConditions.push({ _id: { $in: appointmentPatientIds } });
    }

    if (baseConditions.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      };
    }

    const searchTerm = filters.search ? String(filters.search).trim() : "";
    const searchClauses = [];

    if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), "i");
      searchClauses.push({ full_name: { $regex: regex } });
      searchClauses.push({ uhid: { $regex: regex } });
      searchClauses.push({ contact_number: { $regex: regex } });

      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchingFilePatients = appointmentRecords
        .filter((record) => record.file_number && record.file_number.toLowerCase().includes(lowerSearchTerm))
        .map((record) => String(record._id));

      if (matchingFilePatients.length > 0) {
        searchClauses.push({ _id: { $in: matchingFilePatients } });
      }
    }

    const baseFilter = { $or: baseConditions };
    let query;

    if (searchClauses.length > 0) {
      query = {
        $and: [
          baseFilter,
          { $or: searchClauses }
        ]
      };
    } else {
      query = baseFilter;
    }

    const [total, patients] = await Promise.all([
      Patient.countDocuments(query),
      Patient.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const mappedPatients = patients.map((patient) => {
      const idString = patient._id.toString();
      return {
        id: idString,
        patient_id: idString,
        full_name: patient.full_name,
        uhid: patient.uhid || null,
        contact_number: patient.contact_number || null,
        date_of_birth: patient.date_of_birth?.toISOString() || null,
        file_number: fileNumberByPatientId.get(idString) || null,
        clinic_id: patient.clinic_id || null,
        registration_type: patient.registration_type || null
      };
    });

    return {
      data: mappedPatients,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error retrieving clinic-related patients: ${error.message}`);
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
