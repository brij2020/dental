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
      // Sanitize admin profile data - remove/convert invalid fields
      const adminProfileData = {
        status: "Active",
        ...clinicData?.adminProfile,
        clinic_id: generatedClinicId
      };

      // Remove array values for string-type fields
      if (Array.isArray(adminProfileData.specialization) && adminProfileData.specialization.length === 0) {
        delete adminProfileData.specialization;
      }
      if (Array.isArray(adminProfileData.qualification) && adminProfileData.qualification.length === 0) {
        delete adminProfileData.qualification;
      }

      adminProfile = await profileService.createProfile(adminProfileData);
      console.log('Admin profile created successfully');

      // Update clinic to add admin to admin_staff
      clinicSaved = await Clinic.findByIdAndUpdate(
        clinicSaved._id,
        { 
          admin_staff: adminProfile._id,
          admin_staff_name: adminProfile.full_name
        },
        { new: true }
      );
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
    // Transform _id to id for API response
    return clinics.map(clinic => ({
      id: clinic._id.toString(),
      ...clinic.toObject()
    }));
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
    // Transform _id to id for API response
    return clinics.map(clinic => ({
      id: clinic._id.toString(),
      ...clinic.toObject()
    }));
  } catch (err) {
    logger.error({ err }, 'Error retrieving active clinics');
    throw err;
  }
};

/**
 * Search clinics by name, state, city, pin, and location
 */
const searchClinics = async (filters) => {
  try {
    const query = {};

    // Build search query based on provided filters
    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' }; // Case-insensitive search
    }
    if (filters.state) {
      query['address.state'] = { $regex: filters.state, $options: 'i' };
    }
    if (filters.city) {
      query['address.city'] = { $regex: filters.city, $options: 'i' };
    }
    if (filters.pin) {
      query['address.postal_code'] = filters.pin;
    }
    if (filters.location) {
      // Search in location fields: floor, room_number, wing
      query.$or = [
        { 'location.floor': { $regex: filters.location, $options: 'i' } },
        { 'location.room_number': { $regex: filters.location, $options: 'i' } },
        { 'location.wing': { $regex: filters.location, $options: 'i' } }
      ];
    }

    const clinics = await Clinic.find(query);
    // Transform _id to id for API response
    return clinics.map(clinic => ({
      id: clinic._id.toString(),
      ...clinic.toObject()
    }));
  } catch (err) {
    logger.error({ err }, 'Error searching clinics');
    throw err;
  }
};

/**
 * Get clinic by ID
 */
const getClinicById = async (id) => {
  try {
    const clinic = await Clinic.findOne({clinic_id: id});
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
 * Get clinic by ID
 */
const getClinicSelfId = async (id) => {
  try {
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      throw new Error("Clinic not found");
    }
    // Transform _id to id for API response
    return {
      id: clinic._id.toString(),
      ...clinic.toObject()
    };
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
    let clinic;
    
    // Try to find by MongoDB _id first (if it's a valid ObjectID)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      clinic = await Clinic.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });
    }
    
    // If not found, try clinic_id
    if (!clinic) {
      clinic = await Clinic.findOneAndUpdate({clinic_id:id}, updateData, {
        new: true,
        runValidators: true
      });
    }

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    logger.info({ clinicId: id }, 'Clinic updated successfully');
    // Transform _id to id for API response
    return {
      id: clinic._id.toString(),
      ...clinic.toObject()
    };
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
    let clinic;
    
    // Try to find by MongoDB _id first (if it's a valid ObjectID)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      clinic = await Clinic.findByIdAndDelete(id);
    }
    
    // If not found, try clinic_id
    if (!clinic) {
      clinic = await Clinic.findOneAndDelete({clinic_id: id});
    }

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

/**
 * Get admin/staff schedules for a clinic
 */
const getAdminSchedules = async (clinicId) => {
  try {
    // Try to find by MongoDB _id first (if it's a valid ObjectID)
    let clinic;
    if (clinicId.match(/^[0-9a-fA-F]{24}$/)) {
      clinic = await Clinic.findById(clinicId).populate('admin_staff');
    }
    
    // If not found, try clinic_id
    if (!clinic) {
      clinic = await Clinic.findOne({ clinic_id: clinicId }).populate('admin_staff');
    }

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    // Return populated admin staff with schedule details
    if (!clinic.admin_staff) {
      return null;
    }

    const admin = clinic.admin_staff;
    return {
      id: admin._id.toString(),
      _id: admin._id.toString(),
      name: admin.full_name,
      full_name: admin.full_name,
      email: admin.email,
      role: admin.role,
      clinic_id: admin.clinic_id,
      availability: admin.availability,
      slot_duration_minutes: admin.slot_duration_minutes,
      status: admin.status,
      ...admin.toObject()
    };
  } catch (err) {
    logger.error({ err }, 'Error retrieving admin schedule');
    throw err;
  }
};

/**
 * Get doctor schedules for a clinic
 */
const getDoctorSchedules = async (clinicId) => {
  try {
    // Try to find by MongoDB _id first (if it's a valid ObjectID)
    let clinic;
    if (clinicId.match(/^[0-9a-fA-F]{24}$/)) {
      clinic = await Clinic.findById(clinicId).populate('doctors');
    }
    
    // If not found, try clinic_id
    if (!clinic) {
      clinic = await Clinic.findOne({ clinic_id: clinicId }).populate('doctors');
    }

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    // Return populated doctors with schedule details
    if (!clinic.doctors || clinic.doctors.length === 0) {
      return [];
    }

    return clinic.doctors.map(doctor => ({
      id: doctor._id.toString(),
      _id: doctor._id.toString(),
      name: doctor.full_name,
      full_name: doctor.full_name,
      email: doctor.email,
      role: doctor.role,
      clinic_id: doctor.clinic_id,
      availability: doctor.availability,
      slot_duration_minutes: doctor.slot_duration_minutes,
      status: doctor.status,
      ...doctor.toObject()
    }));
  } catch (err) {
    logger.error({ err }, 'Error retrieving doctor schedules');
    throw err;
  }
};

/**
 * Get specific doctor schedule by doctor ID
 */
const getDoctorScheduleById = async (clinicId, doctorId) => {
  try {
    // Try to find by MongoDB _id first
    let clinic;
    if (clinicId.match(/^[0-9a-fA-F]{24}$/)) {
      clinic = await Clinic.findById(clinicId).populate('doctors');
    }
    
    // If not found, try clinic_id
    if (!clinic) {
      clinic = await Clinic.findOne({ clinic_id: clinicId }).populate('doctors');
    }

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    // Find the specific doctor
    const doctor = clinic.doctors.find(d => d._id.toString() === doctorId);
    if (!doctor) {
      throw new Error("Doctor not found in clinic");
    }

    return {
      id: doctor._id.toString(),
      _id: doctor._id.toString(),
      name: doctor.full_name,
      full_name: doctor.full_name,
      email: doctor.email,
      role: doctor.role,
      clinic_id: doctor.clinic_id,
      availability: doctor.availability,
      slot_duration_minutes: doctor.slot_duration_minutes,
      status: doctor.status,
      ...doctor.toObject()
    };
  } catch (err) {
    logger.error({ err }, 'Error retrieving doctor schedule');
    throw err;
  }
};

module.exports = {
  generateClinicId,
  createClinic,
  getAllClinics,
  getActiveClinics,
  searchClinics,
  getClinicById,
  updateClinic,
  deleteClinic,
  getClinicSelfId,
  getAdminSchedules,
  getDoctorSchedules,
  getDoctorScheduleById
};
