const db = require("../models");
const Profile = db.profiles;
const ProfileArchive = db.profileArchives;
const { logger } = require("../config/logger");

/**
 * Create doctor profile
 */
const createProfile = async (profileData, options = {}) => {
  try {
    const { email, full_name, clinic_id } = profileData;

    if (!email || !full_name || !clinic_id) {
      throw new Error("Email, Full name and Clinic ID are required");
    }

    const doctor = new Profile({
      email: profileData.email,
      mobile_number: profileData.mobile_number,
      full_name: profileData.full_name,
      role: profileData.role || "doctor",
      clinic_id: profileData.clinic_id,
      status: profileData.status || "Active",
      availability: profileData.availability,  // ✅ Let Mongoose apply DEFAULT_AVAILABILITY when undefined
      slot_duration_minutes: profileData.slot_duration_minutes || 15,
      profile_pic: profileData.profile_pic,
      education: profileData.education || [],
      years_of_experience: profileData.years_of_experience || 0,
      specialization: profileData.specialization || [],
      bio: profileData.bio,
      password: profileData.password
    });

    // Support transaction session
    const data = await doctor.save(options);
    return data;
  } catch (err) {
    logger.error({ err }, 'Error creating doctor profile');
    throw err;
  }
};

/**
 * Get all doctors with filtering
 */
const getAllProfiles = async (filters = {}) => {
  try {
    
    const { full_name, clinic_id, status, role } = filters;
    let condition = {};

    if (full_name) {
      condition.full_name = { $regex: full_name, $options: "i" };
    }

    if (clinic_id) {
      condition.clinic_id = clinic_id;
    }

    if (status) {
      condition.status = status;
    }

    // Filter by role - default to 'doctor' or 'admin' if not specified
    if (role) {
      condition.role = role;
    } else {
      condition.role = { $in: ['doctor', 'admin'] };
    }

    const doctors = await Profile.find(condition);
    return doctors;
  } catch (err) {
    logger.error({ err }, 'Error retrieving doctor profiles');
    throw err;
  }
};

/**
 * Get doctor by ID
 */
const getProfileById = async (id) => {
  try {
    if (!id) {
      throw new Error("Doctor ID is required");
    }

    const doctor = await Profile.findById(id);
    console.log('---------------Retrieved doctor profile:', doctor);
    if (!doctor) {
      throw new Error("Doctor not found with id " + id);
    }
    return doctor;
  } catch (err) {
    logger.error({ err }, 'Error retrieving doctor profile');
    throw err;
  }
};

/**
 * Update doctor profile
 */
const updateProfile = async (id, updateData) => {
  try {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error("Data to update cannot be empty");
    }

    const updated = await Profile.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      throw new Error(`Cannot update Doctor with id=${id}`);
    }

    logger.info({ doctorId: id }, 'Doctor profile updated successfully');
    return updated;
  } catch (err) {
    logger.error({ err }, 'Error updating doctor profile');
    throw err;
  }
};

/**
 * Delete doctor profile (soft delete - move to archive)
 */
const deleteProfile = async (id, archivedBy = null, archiveReason = null) => {
  try {
    // Find the profile
    const profile = await Profile.findById(id);

    if (!profile) {
      throw new Error(`Doctor not found with id=${id}`);
    }

    // Create archive entry
    const archiveEntry = new ProfileArchive({
      original_id: profile._id,
      email: profile.email,
      mobile_number: profile.mobile_number,
      full_name: profile.full_name,
      role: profile.role,
      clinic_id: profile.clinic_id,
      status: profile.status,
      availability: profile.availability,
      leave: profile.leave,
      slot_duration_minutes: profile.slot_duration_minutes,
      profile_pic: profile.profile_pic,
      education: profile.education,
      years_of_experience: profile.years_of_experience,
      specialization: profile.specialization,
      bio: profile.bio,
      password: profile.password,
      archived_by: archivedBy,
      archive_reason: archiveReason
    });

    // Save to archive
    await archiveEntry.save();

    // Delete from main collection
    await Profile.findByIdAndDelete(id);

    logger.info({ doctorId: id, archivedById: archiveEntry._id }, 'Doctor profile archived successfully');
    return {
      message: "Doctor profile archived successfully",
      archived: archiveEntry
    };
  } catch (err) {
    logger.error({ err }, 'Error deleting doctor profile');
    throw err;
  }
};

/**
 * Get active profiles
 */
const getActiveProfiles = async () => {
  try {
    const doctors = await Profile.find({ status: "Active" });
    return doctors;
  } catch (err) {
    logger.error({ err }, 'Error retrieving active doctor profiles');
    throw err;
  }
};

/**
 * Get doctor slots (availability and slot_duration_minutes)
 */
const getProfileSlots = async (id) => {
  try {
    if (!id) {
      throw new Error("Profile ID is required");
    }

    const profile = await Profile.findById(id).select('availability slot_duration_minutes full_name');

    if (!profile) {
      throw new Error("Doctor profile not found");
    }

    logger.info(`Retrieved slots for doctor: ${profile.full_name}`, {
      doctorId: id,
    });

    return {
      doctor_id: profile._id,
      full_name: profile.full_name,
      availability: profile.availability,
      slot_duration_minutes: profile.slot_duration_minutes
    };
  } catch (err) {
    logger.error(`Error retrieving doctor slots: ${err.message}`, {
      doctorId: id,
      error: err.message
    });
    throw err;
  }
};

module.exports = {
  createProfile,
  getAllProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  getActiveProfiles,
  getProfileSlots
};
