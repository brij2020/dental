const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const appointmentSchema = new mongoose.Schema(
  {
    appointment_uid: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    clinic_id: {
      type: String,
      required: true,
      index: true,
    },
    patient_id: {
      type: String,
      required: true,
    },
    uhid: {
      type: String,
      default: null,
    },
    full_name: {
      type: String,
      required: true,
    },
    contact_number: {
      type: String,
      default: null,
    },
    appointment_date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    appointment_time: {
      type: String, // HH:MM format
      required: true,
    },
    doctor_id: {
      type: String,
      required: true,
      index: true,
    },
    medical_conditions: {
      type: [String], // Array of condition names (e.g., ["Fever: 102F", "Diabetes"])
      default: [],
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
    notes: {
      type: String,
      default: null,
    },
    patient_note: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup of booked slots for a doctor on a specific date
appointmentSchema.index({ doctor_id: 1, appointment_date: 1, status: 1 });

// Index for clinic-wide queries
appointmentSchema.index({ clinic_id: 1, appointment_date: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
