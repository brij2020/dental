const db = require("../models");
const Clinic = db.clinics;
const { logger } = require("../config/logger");
const profileService = require("./profile.service");

/**
 * Generate clinic ID
 */
const generateClinicId = async (clinicName) => {
  try {
    const namePrefix = clinicName.substring(0, 3).toUpperCase();
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const count = await Clinic.countDocuments();
    const incrementNumber = String(count + 1).padStart(5, '0');
    const generatedClinicId = `${namePrefix}${yearSuffix}${incrementNumber}`;
    return generatedClinicId;
  } catch (err) {
    logger.error({ err }, 'Error generating clinic ID');
    throw err;
  }
};

/**
 * Create clinic with admin profile
 */
const createClinic = async (clinicData) => {
  let clinicSaved = null;
  try {
    const { name, phone } = clinicData;

    if (!name || !phone) {
      throw new Error("Name and Phone are required");
    }

    // Validate admin profile data
    if (!clinicData?.adminProfile || !clinicData.adminProfile.email) {
      throw new Error("Admin profile with email is required");
    }

    // Generate clinic ID
    const generatedClinicId = await generateClinicId(name);
    console.log('Generated Clinic ID:', generatedClinicId);

    // Create clinic
    const clinic = new Clinic({
      name: clinicData.name,
      phone: clinicData.phone,
      address: clinicData.address || {},
      clinic_id: generatedClinicId,
      status: clinicData.status || "Active",
      logo: clinicData.logo,
      branding_moto: clinicData.branding_moto,
      location: clinicData.location || {},
      description: clinicData.description
    });

    clinicSaved = await clinic.save();
    console.log('Clinic created successfully:', generatedClinicId);

    // Try to create admin profile
    let adminProfile;
    try {
      adminProfile = await profileService.createProfile({
        status: "Active",
        ...clinicData?.adminProfile,
        clinic_id: generatedClinicId
      });
      console.log('Admin profile created successfully');
    } catch (adminErr) {
      console.log('Admin profile creation failed, reverting clinic...');
      logger.error({ adminErr }, 'Admin profile creation failed, initiating rollback');
      
      // Rollback: Delete the clinic that was just created
      try {
        await Clinic.findByIdAndDelete(clinicSaved._id);
        console.log('Clinic reverted successfully');
        logger.info({ clinicId: generatedClinicId }, 'Clinic reverted due to admin profile creation failure');
      } catch (deleteErr) {
        logger.error({ deleteErr }, 'Failed to revert clinic after admin profile creation failed');
        throw new Error('Critical error: Could not revert clinic after admin creation failed');
      }
      
      // Throw the admin profile creation error
      throw new Error(`Admin profile creation failed: ${adminErr.message}`);
    }

    logger.info({ clinicId: generatedClinicId }, 'Clinic and admin profile created successfully');
    
    return {
      clinic: clinicSaved,
      admin: adminProfile
    };
  } catch (err) {
    console.log(err);
    logger.error({ err }, 'Error creating clinic');
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      if (field === 'clinic_id') {
        throw new Error('This clinic ID already exists. Please use a different clinic name.');
      }
      throw new Error('Unable to create clinic due to database constraint. Please contact support.');
    }
    
    throw err;
  }
};

/**
 * Get all clinics
 */
const getAllClinics = async () => {
  try {
    const clinics = await Clinic.find({});
    return clinics;
  } catch (err) {
    logger.error({ err }, 'Error retrieving clinics');
    throw err;
  }
};

/**
 * Get active clinics
 */
const getActiveClinics = async () => {
  try {
    const clinics = await Clinic.find({ status: "Active" });
    return clinics;
  } catch (err) {
    logger.error({ err }, 'Error retrieving active clinics');
    throw err;
  }
};

/**
 * Get clinic by ID
 */
const getClinicById = async (id) => {
  try {
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      throw new Error("Clinic not found");
    }
    return clinic;
  } catch (err) {
    logger.error({ err }, 'Error retrieving clinic');
    throw err;
  }
};

/**
 * Update clinic
 */
const updateClinic = async (id, updateData) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    logger.info({ clinicId: id }, 'Clinic updated successfully');
    return clinic;
  } catch (err) {
    logger.error({ err }, 'Error updating clinic');
    throw err;
  }
};

/**
 * Delete clinic
 */
const deleteClinic = async (id) => {
  try {
    const clinic = await Clinic.findByIdAndRemove(id);

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    logger.info({ clinicId: id }, 'Clinic deleted successfully');
    return clinic;
  } catch (err) {
    logger.error({ err }, 'Error deleting clinic');
    throw err;
  }
};

module.exports = {
  generateClinicId,
  createClinic,
  getAllClinics,
  getActiveClinics,
  getClinicById,
  updateClinic,
  deleteClinic
};
