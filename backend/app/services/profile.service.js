const db = require("../models");
const Profile = db.profiles;
const ProfileArchive = db.profileArchives;
const { logger } = require("../config/logger");
const clinicSubscriptionService = require("./clinicSubscription.service");

/**
 * Create doctor profile
 */
const createProfile = async (profileData, options = {}) => {
  try {
    const { email, full_name, clinic_id } = profileData;

    if (!email || !full_name || !clinic_id) {
      throw new Error("Email, Full name and Clinic ID are required");
    }

    const activeSub = await clinicSubscriptionService.getActiveSubscriptionByClinicId(clinic_id);
    const limits = activeSub?.limits_snapshot || {};

    if (profileData.role === "doctor" && limits.max_doctors && limits.max_doctors > 0) {
      const doctorCount = await Profile.countDocuments({ clinic_id, role: "doctor" });
      if (doctorCount >= limits.max_doctors) {
        throw new Error("Doctor limit reached for current subscription");
      }
    }

    if ((profileData.role === "admin" || profileData.role === "receptionist") && limits.max_staff && limits.max_staff > 0) {
      const staffCount = await Profile.countDocuments({ clinic_id, role: { $in: ["admin", "receptionist"] } });
      if (staffCount >= limits.max_staff) {
        throw new Error("Staff limit reached for current subscription");
      }
    }

    const doctor = new Profile({
      email: profileData.email,
      mobile_number: profileData.mobile_number,
      full_name: profileData.full_name,
      role: profileData.role || "doctor",
      clinic_id: profileData.clinic_id,
      status: profileData.status || "Active",
      slot_duration_minutes: profileData.slot_duration_minutes || 15,
      profile_pic: profileData.profile_pic,
      education: profileData.education || [],
      years_of_experience: profileData.years_of_experience || 0,
      specialization: Array.isArray(profileData.specialization)
        ? profileData.specialization.join(', ')
        : (profileData.specialization || ''),
      bio: profileData.bio,
      password: profileData.password,
      // Only set capacity for doctors and admins, not for receptionist
      capacity: (profileData.role === 'doctor' || profileData.role === 'admin') ? (profileData.capacity || "1x") : null
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
    console.log('Filters applied for getAllProfiles:', filters);
    const { full_name, clinic_id, status, role, page = '' } = filters;
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
    if(page == 'staff'){
      delete condition.role
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

    // Ensure specialization matches schema type (string). If client sent an array, join it.
    if (updateData.specialization && Array.isArray(updateData.specialization)) {
      updateData.specialization = updateData.specialization.join(', ');
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
const getProfileSlots = async (id, availabilityType = 'in_person') => {
  try {
    if (!id) {
      throw new Error("Profile ID is required");
    }

    const profile = await Profile.findById(id).select(
      'availability v_availability slot_duration_minutes full_name capacity'
    );

    if (!profile) {
      throw new Error("Doctor profile not found");
    }

    logger.info(`Retrieved slots for doctor: ${profile.full_name}`, {
      doctorId: id,
    });

    const availabilityField = availabilityType === 'video' ? 'v_availability' : 'availability';
    return {
      doctor_id: profile._id,
      full_name: profile.full_name,
      availability: profile[availabilityField],
      slot_duration_minutes: profile.slot_duration_minutes,
      capacity: profile.capacity
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

/**
 * Admin reset password for another profile
 * - verify admin's current password
 * - set new password on target profile and save (so pre-save hook hashes it)
 */
const adminResetPassword = async (targetProfileId, adminId, adminCurrentPassword, newPassword) => {
  try {
    if (!targetProfileId || !adminId || !adminCurrentPassword || !newPassword) {
      throw new Error('Missing required data');
    }

    // Load admin with password for verification
    const admin = await Profile.findById(adminId).select('+password');
    if (!admin) throw new Error('Admin profile not found');

    const isMatch = await admin.comparePassword(adminCurrentPassword);
    if (!isMatch) {
      const err = new Error('Admin current password is incorrect');
      err.name = 'AuthError';
      throw err;
    }

    // Load target profile
    const target = await Profile.findById(targetProfileId).select('+password');
    if (!target) {
      const err = new Error('Target profile not found');
      err.name = 'NotFound';
      throw err;
    }

    // Set new password and save (pre-save will hash)
    target.password = newPassword;
    await target.save();

    return { message: 'Password updated successfully' };
  } catch (err) {
    logger.error({ err }, 'Error in adminResetPassword');
    throw err;
  }
};

module.exports.adminResetPassword = adminResetPassword;
