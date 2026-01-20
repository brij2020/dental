const mongoose = require('mongoose');

const doctorLeaveSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: String,
      required: true,
      index: true,
    },
    clinic_id: {
      type: String,
      required: true,
      index: true,
    },
    leave_start_date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    leave_end_date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup of leaves for a doctor
doctorLeaveSchema.index({ doctor_id: 1, clinic_id: 1, is_active: 1 });

// Index for date range queries
doctorLeaveSchema.index({ leave_start_date: 1, leave_end_date: 1 });

const DoctorLeave = mongoose.model('DoctorLeave', doctorLeaveSchema);

module.exports = DoctorLeave;
