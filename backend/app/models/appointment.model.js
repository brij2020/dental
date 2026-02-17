const mongoose = require('mongoose');
const crypto = require('crypto');

const appointmentSchema = new mongoose.Schema(
  {
    appointment_uid: {
      type: String,
      default: () => (crypto.randomUUID ? crypto.randomUUID() : require('uuid').v4()),
      unique: true,
      index: true,
    },
    file_number: {
      type: String,
      sparse: true,
      trim: true,
      description: "Auto-generated file number in format: CCYY##### (CC=clinic name first 2 letters, YY=year last 2 digits, #####=5-digit increment)"
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
    appointment_type: {
      type: String,
      enum: ['in_person', 'video'],
      default: 'in_person',
      index: true,
    },
    doctor_id: {
      type: String,
      required: true,
      index: true,
    },
    doctor_name: {
      type: String,
      default: null,
      description: 'Snapshot of the doctor full_name at booking time (for quick display)'
    },
    medical_conditions: {
      type: [String], // Array of condition names (e.g., ["Fever: 102F", "Diabetes"])
      default: [],
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'],
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
    clinics: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      description: "Embedded clinic details snapshot taken at booking time"
    }
    ,
    provisional: {
      type: Boolean,
      default: false,
      index: true,
      description: 'Whether this appointment was created from patient portal and is provisional'
    }
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup of booked slots for a doctor on a specific date
appointmentSchema.index({ doctor_id: 1, appointment_date: 1, status: 1 });

// Index for clinic-wide queries
appointmentSchema.index({ clinic_id: 1, appointment_date: 1 });

/**
 * Pre-save hook to auto-generate File Number if not provided
 * 
 * File Number Format: CCYY##### 
 *   - CC = First 2 letters of clinic name (uppercase)
 *   - YY = Last 2 digits of current year
 *   - ##### = 5-digit increment (00001, 00002, etc.)
 *   Example: MA2600001 (for "Manas Dental", year 2026, 1st appointment)
 */
const generateAppointmentFileNumber = async (clinicId) => {
  try {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const Clinic = mongoose.model('Clinic');
    const clinic = await Clinic.findOne({ clinic_id: clinicId });

    if (!clinic || !clinic.name) {
      return null;
    }

    const clinicPrefix = clinic.name.substring(0, 2).toUpperCase();
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const appointmentCountThisYear = await mongoose.model('Appointment').countDocuments({
      clinic_id: clinicId,
      createdAt: { $gte: startOfYear }
    });

    const sequence = String(appointmentCountThisYear + 1).padStart(5, '0');
    return `${clinicPrefix}${currentYear}${sequence}`;
  } catch (clinicError) {
    console.warn('Could not generate appointment file number:', clinicError.message);
    return null;
  }
};

appointmentSchema.pre('save', async function (next) {
  try {
    if (this.provisional !== false || !this.clinic_id) {
      return next();
    }

    if (!this.file_number) {
      const generated = await generateAppointmentFileNumber(this.clinic_id);
      if (generated) {
        this.file_number = generated;
      }
    }

    next();
  } catch (error) {
    console.error('Error in appointment pre-save hook:', error);
    next(error);
  }
});

appointmentSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    if (!update) {
      return next();
    }

    const provisionalValue = update.$set?.provisional ?? update.provisional;
    if (provisionalValue !== false) {
      return next();
    }

    const hasFileNumberInUpdate = update.$set?.file_number ?? update.file_number;
    if (hasFileNumberInUpdate) {
      return next();
    }

    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) {
      return next();
    }

    if (docToUpdate.file_number) {
      return next();
    }

    const clinicId = update.$set?.clinic_id ?? update.clinic_id ?? docToUpdate.clinic_id;
    if (!clinicId) {
      return next();
    }

    const generated = await generateAppointmentFileNumber(clinicId);
    if (!generated) {
      return next();
    }

    if (update.$set) {
      update.$set.file_number = generated;
    } else {
      update.file_number = generated;
    }

    this.setUpdate(update);
    next();
  } catch (error) {
    console.error('Error generating file number on update:', error);
    next(error);
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
