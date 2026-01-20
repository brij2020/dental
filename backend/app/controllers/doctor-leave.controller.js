const DoctorLeaveService = require('../services/doctor-leave.service');

exports.create = async (req, res) => {
  try {
    const { doctor_id, clinic_id, leave_start_date, leave_end_date, reason } = req.body;

    if (!doctor_id || !clinic_id || !leave_start_date || !leave_end_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctor_id, clinic_id, leave_start_date, leave_end_date',
      });
    }

    // Validate that start date is before or equal to end date
    if (leave_start_date > leave_end_date) {
      return res.status(400).json({
        success: false,
        message: 'leave_start_date must be before or equal to leave_end_date',
      });
    }

    const leaveData = {
      doctor_id,
      clinic_id,
      leave_start_date,
      leave_end_date,
      reason: reason || null,
      is_active: true,
    };

    const leave = await DoctorLeaveService.createLeave(leaveData);

    return res.status(201).json({
      success: true,
      data: leave,
      message: 'Doctor leave created successfully',
    });
  } catch (error) {
    console.error('Error creating doctor leave:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create doctor leave',
    });
  }
};

exports.getByDoctor = async (req, res) => {
  try {
    const { doctor_id, clinic_id } = req.query;

    if (!doctor_id) {
      return res.status(400).json({
        success: false,
        message: 'doctor_id is required',
      });
    }

    const leaves = await DoctorLeaveService.getLeavesByDoctor(doctor_id, clinic_id || null);

    return res.status(200).json({
      success: true,
      data: leaves,
      message: 'Doctor leaves retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching doctor leaves:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch doctor leaves',
    });
  }
};

exports.checkLeave = async (req, res) => {
  try {
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: doctor_id, date',
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const leave = await DoctorLeaveService.isInLeave(doctor_id, date);

    return res.status(200).json({
      success: true,
      data: {
        isOnLeave: !!leave,
        leave: leave || null,
      },
      message: 'Leave status checked successfully',
    });
  } catch (error) {
    console.error('Error checking doctor leave:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to check doctor leave',
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await DoctorLeaveService.getLeaveById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Doctor leave record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: leave,
      message: 'Doctor leave retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching doctor leave:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch doctor leave',
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate dates if both are provided
    if (updateData.leave_start_date && updateData.leave_end_date) {
      if (updateData.leave_start_date > updateData.leave_end_date) {
        return res.status(400).json({
          success: false,
          message: 'leave_start_date must be before or equal to leave_end_date',
        });
      }
    }

    const leave = await DoctorLeaveService.updateLeave(id, updateData);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Doctor leave record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: leave,
      message: 'Doctor leave updated successfully',
    });
  } catch (error) {
    console.error('Error updating doctor leave:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update doctor leave',
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await DoctorLeaveService.deleteLeave(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Doctor leave record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: leave,
      message: 'Doctor leave deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting doctor leave:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete doctor leave',
    });
  }
};

exports.getByClinic = async (req, res) => {
  try {
    const { clinic_id } = req.params;

    if (!clinic_id) {
      return res.status(400).json({
        success: false,
        message: 'clinic_id is required',
      });
    }

    const leaves = await DoctorLeaveService.getLeavesByClinic(clinic_id);

    return res.status(200).json({
      success: true,
      data: leaves,
      message: 'Clinic leaves retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching clinic leaves:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch clinic leaves',
    });
  }
};
