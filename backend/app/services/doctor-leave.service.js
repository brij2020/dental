const DoctorLeave = require('../models/doctor-leave.model');

class DoctorLeaveService {
  // Create a new leave record
  static async createLeave(leaveData) {
    const leave = new DoctorLeave(leaveData);
    return await leave.save();
  }

  // Get all leaves for a doctor
  static async getLeavesByDoctor(doctorId, clinicId = null) {
    const query = { doctor_id: doctorId, is_active: true };
    if (clinicId) query.clinic_id = clinicId;
    
    return await DoctorLeave.find(query).sort({ leave_start_date: 1 });
  }

  // Check if a doctor is on leave on a specific date
  static async isInLeave(doctorId, date) {
    const leave = await DoctorLeave.findOne({
      doctor_id: doctorId,
      is_active: true,
      leave_start_date: { $lte: date },
      leave_end_date: { $gte: date },
    });

    return leave || null; // Returns the leave object if found, null otherwise
  }

  // Get leave by ID
  static async getLeaveById(leaveId) {
    return await DoctorLeave.findById(leaveId);
  }

  // Update a leave record
  static async updateLeave(leaveId, updateData) {
    return await DoctorLeave.findByIdAndUpdate(leaveId, updateData, { new: true });
  }

  // Delete a leave record
  static async deleteLeave(leaveId) {
    return await DoctorLeave.findByIdAndDelete(leaveId);
  }

  // Get all active leaves for a clinic
  static async getLeavesByClinic(clinicId) {
    // Fetch explicit leave records stored in DoctorLeave collection
    const explicitLeaves = await DoctorLeave.find({ clinic_id: clinicId, is_active: true }).sort({ leave_start_date: 1 }).lean();

    // Also include per-profile `leave` entries stored on Profile documents (some installs store single-day leaves there)
    try {
      const Profile = require('../models/profile.model');
      const profiles = await Profile.find({ clinic_id: clinicId, leave: { $exists: true, $ne: [] } }).select('leave _id full_name').lean();
      const profileLeaves = [];
      profiles.forEach(p => {
        if (Array.isArray(p.leave)) {
          p.leave.forEach(l => {
            // normalize shape to match DoctorLeave
            const date = l.date || l.leave_start_date;
            if (!date) return;
            profileLeaves.push({
              doctor_id: String(p._id),
              doctor_name: p.full_name,
              clinic_id: clinicId,
              leave_start_date: date,
              leave_end_date: date,
              reason: l.reason || null,
              _source: 'profile'
            });
          });
        }
      });

      // Merge and sort by start date
      const merged = explicitLeaves.concat(profileLeaves);
      merged.sort((a, b) => (a.leave_start_date || '').localeCompare(b.leave_start_date || ''));
      return merged;
    } catch (err) {
      // If profile lookup fails, return explicit leaves only
      return explicitLeaves;
    }
  }

  // Deactivate a leave record (soft delete)
  static async deactivateLeave(leaveId) {
    return await DoctorLeave.findByIdAndUpdate(leaveId, { is_active: false }, { new: true });
  }
}

module.exports = DoctorLeaveService;
