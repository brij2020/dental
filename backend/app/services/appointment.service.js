const Appointment = require('../models/appointment.model');

class AppointmentService {
  // Create a new appointment
  static async createAppointment(appointmentData) {
    const appointment = new Appointment(appointmentData);
    return await appointment.save();
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
}

module.exports = AppointmentService;
