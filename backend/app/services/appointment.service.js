const Appointment = require('../models/appointment.model');

class AppointmentService {
  // Create a new appointment with clinic and doctor snapshots
  static async createAppointment(appointmentData) {
    try {
    

      const appointment = new Appointment(appointmentData);
      return await appointment.save();
    } catch (error) {
      console.error('Error in createAppointment:', error);
      throw error;
    }
  }

  // Get booked slots for a specific doctor on a specific date
  static async getBookedSlotsForDoctorOnDate(doctorId, date) {
    const appointments = await Appointment.find({
      doctor_id: doctorId,
      appointment_date: date,
      status: { $in: ['scheduled', 'confirmed'] }, // Exclude cancelled & completed
    });

    return appointments.map(apt => apt.appointment_time);
  }

  // Get all appointments for a clinic (with date and search support)
  static async getAppointmentsByClinic(clinicId, filters = {}) {
    const query = { clinic_id: clinicId };
    
    // Search by appointment_uid if provided
    if (filters.search) {
      query.appointment_uid = { $regex: filters.search.trim(), $options: 'i' }; // Case-insensitive search
    } else if (filters.date) {
      // Filter by specific date if provided (and no search term)
      query.appointment_date = filters.date;
    }
    
    // Optional filters
    if (filters.status) query.status = filters.status;
    if (filters.doctorId) query.doctor_id = filters.doctorId;
    if (filters.appointment_type) query.appointment_type = filters.appointment_type;
    if (filters.provisional !== undefined) {
      query.provisional = (filters.provisional === true || filters.provisional === 'true');
    }
    if (filters.startDate || filters.endDate) {
      query.appointment_date = {};
      if (filters.startDate) query.appointment_date.$gte = filters.startDate;
      if (filters.endDate) query.appointment_date.$lte = filters.endDate;
    }

    return await Appointment.find(query).sort({ appointment_time: 1 }).populate('doctor_id', 'full_name');
  }

  // Get a single appointment by ID (supports both appointment_uid and MongoDB _id)
  static async getAppointmentById(appointmentId) {
    // First, try to find by appointment_uid
    let appointment = await Appointment.findOne({ appointment_uid: appointmentId });
    
    if (appointment) {
      return appointment;
    }

    // If not found by appointment_uid and it's a valid ObjectId, try by _id
    if (appointmentId.length === 24 && /^[0-9a-fA-F]{24}$/.test(appointmentId)) {
      appointment = await Appointment.findById(appointmentId);
    }

    return appointment;
  }

  // Get appointment by UID
  static async getAppointmentByUid(appointmentUid) {
    return await Appointment.findOne({ appointment_uid: appointmentUid });
  }

  // Update an appointment
  static async updateAppointment(appointmentId, updateData) {
    // First, try to find and update by appointment_uid
    let appointment = await Appointment.findOneAndUpdate(
      { appointment_uid: appointmentId },
      updateData,
      { new: true }
    );

    if (appointment) {
      return appointment;
    }

    // If not found by appointment_uid and it's a valid ObjectId, try by _id
    if (appointmentId.length === 24 && /^[0-9a-fA-F]{24}$/.test(appointmentId)) {
      appointment = await Appointment.findByIdAndUpdate(appointmentId, updateData, { new: true });
    }

    return appointment;
  }

  // Reschedule an appointment with slot capacity checks
  static async rescheduleAppointment(appointmentId, updateData) {
    // Find existing appointment by uid or _id
    let appointment = await Appointment.findOne({ appointment_uid: appointmentId });
    if (!appointment) {
      if (appointmentId.length === 24 && /^[0-9a-fA-F]{24}$/.test(appointmentId)) {
        appointment = await Appointment.findById(appointmentId);
      }
    }

    if (!appointment) {
      return null;
    }

    const newDate = updateData.appointment_date || appointment.appointment_date;
    const newTime = updateData.appointment_time || appointment.appointment_time;
    const doctorId = updateData.doctor_id || appointment.doctor_id;

    // Determine slot capacity from doctor profile
    const dbModels = require('../models');
    const Profile = dbModels.profiles;
    let slotCapacity = 1;
    try {
      const doctorProfile = await Profile.findById(doctorId);
      if (doctorProfile && doctorProfile.role === 'admin') {
        const capStr = doctorProfile.capacity || '1x';
        const match = capStr.match(/(\d+)x/);
        slotCapacity = match ? parseInt(match[1], 10) : 1;
      }
    } catch (err) {
      // ignore and use default capacity
    }

    // Count existing bookings for the slot excluding this appointment
    const bookedCount = await Appointment.countDocuments({
      doctor_id: doctorId,
      appointment_date: newDate,
      appointment_time: newTime,
      status: { $in: ['scheduled', 'confirmed'] },
      _id: { $ne: appointment._id }
    });

    if (bookedCount >= slotCapacity) {
      const err = new Error('Selected slot is fully booked');
      err.code = 'SLOT_FULL';
      throw err;
    }

    // Safe to update
    const updated = await Appointment.findByIdAndUpdate(appointment._id, updateData, { new: true });
    return updated;
  }

  // Delete an appointment
  static async deleteAppointment(appointmentId) {
    // First, try to find and delete by appointment_uid
    let appointment = await Appointment.findOneAndDelete({ appointment_uid: appointmentId });

    if (appointment) {
      return appointment;
    }

    // If not found by appointment_uid and it's a valid ObjectId, try by _id
    if (appointmentId.length === 24 && /^[0-9a-fA-F]{24}$/.test(appointmentId)) {
      appointment = await Appointment.findByIdAndDelete(appointmentId);
    }

    return appointment;
  }

  // Check if a doctor has appointments on a specific date
  static async getDoctorAppointmentsOnDate(doctorId, date) {
    return await Appointment.find({
      doctor_id: doctorId,
      appointment_date: date,
      status: { $in: ['scheduled', 'confirmed'] },
    });
  }

  // Get upcoming appointments for a patient
  static async getPatientUpcomingAppointments(patientId, limit = 10) {
    const today = new Date().toISOString().split('T')[0];
    return await Appointment.find({
      patient_id: patientId,
      appointment_date: { $gte: today },
    })
      .sort({ appointment_date: 1, appointment_time: 1 })
      .limit(limit);
  }

  // Get all appointments for a patient (upcoming, previous, missed)
  static async getPatientAppointments(patientId) {
    return await Appointment.find({ patient_id: patientId })
      .sort({ appointment_date: 1, appointment_time: 1 });
  }

  // Get appointment history for a patient with a specific doctor
  static async getPatientDoctorHistory(patientId, doctorId) {
    return await Appointment.find({
      patient_id: patientId,
      doctor_id: doctorId,
    })
      .sort({ appointment_date: -1, appointment_time: -1 })
      .lean(); // Use lean() for read-only queries for better performance
  }
}

module.exports = AppointmentService;
