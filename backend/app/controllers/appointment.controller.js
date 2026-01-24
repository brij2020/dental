const AppointmentService = require('../services/appointment.service');
const db = require('../models');
const Appointment = db.appointments;

exports.book = async (req, res) => {
  try {
    const {
      clinic_id,
      patient_id,
      uhid,
      full_name,
      contact_number,
      appointment_date,
      appointment_time,
      doctor_id,
      medical_conditions,
      clinics,
    } = req.body;

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!clinic_id) missingFields.push('clinic_id');
    if (!patient_id) missingFields.push('patient_id');
    if (!full_name) missingFields.push('full_name');
    if (!appointment_date) missingFields.push('appointment_date');
    if (!appointment_time) missingFields.push('appointment_time');
    if (!doctor_id) missingFields.push('doctor_id');

    if (missingFields.length > 0) {
      console.warn('Missing fields in appointment booking:', { missingFields });
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
        code: 'MISSING_REQUIRED_FIELDS',
      });
    }

    // Validate appointment date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointment_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment_date format. Expected YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    // Validate appointment time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(appointment_time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment_time format. Expected HH:MM',
        code: 'INVALID_TIME_FORMAT',
      });
    }

    // Check if patient already has an appointment on the same day at the same clinic
    const existingPatientAppointment = await Appointment.findOne({
      patient_id: patient_id,
      clinic_id: clinic_id,
      appointment_date: appointment_date,
      status: { $in: ['scheduled', 'confirmed'] } // Don't count cancelled or completed
    });

    if (existingPatientAppointment) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment scheduled at this clinic for this date. Please cancel it first or choose a different date.',
        code: 'DUPLICATE_APPOINTMENT_ON_DATE',
      });
    }

    // Check for duplicate booking (same doctor, date, time)
    const existingAppointment = await AppointmentService.getBookedSlotsForDoctorOnDate(doctor_id, appointment_date);
    if (existingAppointment.includes(appointment_time)) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another slot.',
        code: 'SLOT_ALREADY_BOOKED',
      });
    }

    const appointmentData = {
      clinic_id,
      patient_id,
      uhid: uhid || null,
      full_name,
      contact_number: contact_number || null,
      appointment_date,
      appointment_time,
      doctor_id,
      medical_conditions: medical_conditions || [],
      status: 'scheduled',
      clinics: clinics || null,
    };

    const appointment = await AppointmentService.createAppointment(appointmentData);

    return res.status(201).json({
      success: true,
      data: {
        appointment_uid: appointment.appointment_uid,
        id: appointment._id,
      },
      message: 'Appointment booked successfully',
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Appointment with this UID already exists',
        code: 'DUPLICATE_ENTRY',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(422).json({
        success: false,
        message: 'Invalid appointment data',
        code: 'VALIDATION_ERROR',
        details: error.message,
      });
    }

    // Server error
    return res.status(500).json({
      success: false,
      message: 'Failed to book appointment. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

exports.getBookedSlots = async (req, res) => {
  try {
    const { doctor_id, appointment_date } = req.query;

    if (!doctor_id || !appointment_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: doctor_id, appointment_date',
        code: 'MISSING_QUERY_PARAMS',
      });
    }

    // Validate appointment date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointment_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment_date format. Expected YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    const slots = await AppointmentService.getBookedSlotsForDoctorOnDate(doctor_id, appointment_date);

    return res.status(200).json({
      success: true,
      data: slots,
      message: 'Booked slots retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booked slots. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

exports.getByClinic = async (req, res) => {
  try {
    const { clinic_id } = req.params;
    const { status, doctorId, patientId, startDate, endDate, date, search } = req.query;

    if (!clinic_id) {
      return res.status(400).json({
        success: false,
        message: 'clinic_id is required',
        code: 'MISSING_CLINIC_ID',
      });
    }

    // Validate status enum if provided
    const validStatuses = ['scheduled', 'confirmed', 'cancelled', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(422).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS_VALUE',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (date && !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    if (startDate && !dateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Expected YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    if (endDate && !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate format. Expected YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    const filters = {
      status: status || undefined,
      doctorId: doctorId || undefined,
      patientId: patientId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      date: date || undefined,
      search: search || undefined,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const appointments = await AppointmentService.getAppointmentsByClinic(clinic_id, filters);

    return res.status(200).json({
      success: true,
      data: appointments,
      message: `Retrieved ${appointments.length} appointment(s)`,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

exports.getByPatient = async (req, res) => {
  try {
    const patientId = req.user?.id || req.user?.patient_id;

    console.log('🔍 Token contents:', req.user);
    console.log('🔍 PatientId extracted:', patientId);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID not found in token. Please log out and log back in.',
        code: 'MISSING_PATIENT_ID',
        debug: { token_data: req.user }
      });
    }

    const appointments = await AppointmentService.getPatientAppointments(patientId);
    
    return res.status(200).json({
      success: true,
      data: appointments,
      message: 'Patient appointments retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required',
        code: 'MISSING_APPOINTMENT_ID',
      });
    }

    const appointment = await AppointmentService.getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required',
        code: 'MISSING_APPOINTMENT_ID',
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided',
        code: 'EMPTY_UPDATE_DATA',
      });
    }

    // Validate status enum if provided
    if (updateData.status) {
      const validStatuses = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(422).json({
          success: false,
          message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS_VALUE',
        });
      }
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (updateData.appointment_date && !dateRegex.test(updateData.appointment_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment_date format. Expected YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    // Validate time format if provided
    const timeRegex = /^\d{2}:\d{2}$/;
    if (updateData.appointment_time && !timeRegex.test(updateData.appointment_time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment_time format. Expected HH:MM',
        code: 'INVALID_TIME_FORMAT',
      });
    }

    const appointment = await AppointmentService.updateAppointment(id, updateData);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('Error updating appointment:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(422).json({
        success: false,
        message: 'Invalid appointment data',
        code: 'VALIDATION_ERROR',
        details: error.message,
      });
    }

    // Server error
    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required',
        code: 'MISSING_APPOINTMENT_ID',
      });
    }

    const appointment = await AppointmentService.deleteAppointment(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND',
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete appointment. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

// Get appointment history for a patient with a specific doctor
exports.getDoctorHistory = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const doctorId = req.query.doctorId;

    // Validate required parameters
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
        code: 'MISSING_PATIENT_ID',
      });
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
        code: 'MISSING_DOCTOR_ID',
      });
    }

    // Get appointment history
    const appointments = await AppointmentService.getPatientDoctorHistory(patientId, doctorId);

    return res.status(200).json({
      success: true,
      data: appointments,
      count: appointments.length,
      message: 'Patient doctor history retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching patient doctor history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment history',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};
