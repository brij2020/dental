const Consultation = require("../models/consultation.model");
const { logger } = require("../config/logger");

/**
 * Create a new consultation
 */
const createConsultation = async (consultationData) => {
  try {
    const consultation = new Consultation({
      appointment_id: consultationData.appointment_id,
      clinic_id: consultationData.clinic_id,
      patient_id: consultationData.patient_id,
      doctor_id: consultationData.doctor_id || null,
      chief_complaints: consultationData.chief_complaints || null,
      on_examination: consultationData.on_examination || null,
      advice: consultationData.advice || null,
      notes: consultationData.notes || null,
      consultation_fee: consultationData.consultation_fee || 0,
      other_amount: consultationData.other_amount || 0,
      discount: consultationData.discount || 0,
      procedure_amount: consultationData.procedure_amount || 0,
      subtotal: consultationData.subtotal || 0,
      total_amount: consultationData.total_amount || 0,
      total_paid: consultationData.total_paid || 0,
      amount_due: consultationData.amount_due || 0,
      previous_outstanding_balance: consultationData.previous_outstanding_balance || 0,
      medical_history: consultationData.medical_history || [],
      status: consultationData.status || "Draft"
    });

    const savedConsultation = await consultation.save();
    logger.info({ consultationId: savedConsultation._id }, 'Consultation created successfully');
    
    return {
      id: savedConsultation._id.toString(),
      ...savedConsultation.toObject()
    };
  } catch (err) {
    logger.error({ err }, 'Error creating consultation');
    if (err.code === 11000) {
      throw new Error('A consultation already exists for this appointment');
    }
    throw err;
  }
};

/**
 * Get consultation by ID
 */
const getConsultationById = async (id) => {
  try {
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new Error("Consultation not found");
    }
    return {
      id: consultation._id.toString(),
      ...consultation.toObject()
    };
  } catch (err) {
    logger.error({ err, consultationId: id }, 'Error retrieving consultation');
    throw err;
  }
};

/**
 * Get consultation by appointment ID
 */
const getConsultationByAppointmentId = async (appointmentId) => {
  try {
    const consultation = await Consultation.findOne({ appointment_id: appointmentId });
    if (!consultation) {
      return null;
    }
    return {
      id: consultation._id.toString(),
      ...consultation.toObject()
    };
  } catch (err) {
    logger.error({ err, appointmentId }, 'Error retrieving consultation by appointment ID');
    throw err;
  }
};

/**
 * Get or create consultation by appointment ID
 */
const getOrCreateConsultation = async (appointmentId, consultationData) => {
  try {
    // Try to find existing consultation
    let consultation = await Consultation.findOne({ appointment_id: appointmentId });
    
    if (consultation) {
      return {
        id: consultation._id.toString(),
        ...consultation.toObject()
      };
    }

    // Create new consultation if not found
    const newConsultation = new Consultation({
      appointment_id: appointmentId,
      clinic_id: consultationData.clinic_id,
      patient_id: consultationData.patient_id,
      doctor_id: consultationData.doctor_id || null,
      status: "Draft",
      consultation_fee: 0,
      other_amount: 0,
      discount: 0,
      procedure_amount: 0,
      subtotal: 0,
      total_amount: 0,
      total_paid: 0,
      amount_due: 0,
      previous_outstanding_balance: 0,
      medical_history: []
    });

    const savedConsultation = await newConsultation.save();
    logger.info({ consultationId: savedConsultation._id }, 'Consultation created via getOrCreate');
    
    return {
      id: savedConsultation._id.toString(),
      ...savedConsultation.toObject()
    };
  } catch (err) {
    logger.error({ err, appointmentId }, 'Error in getOrCreateConsultation');
    if (err.code === 11000) {
      // Race condition: another request created it, fetch it
      const consultation = await Consultation.findOne({ appointment_id: appointmentId });
      if (consultation) {
        return {
          id: consultation._id.toString(),
          ...consultation.toObject()
        };
      }
    }
    throw err;
  }
};

/**
 * Update consultation
 */
const Appointment = require('../models/appointment.model');

const updateConsultation = async (id, updateData) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updated_at: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!consultation) {
      throw new Error("Consultation not found");
    }

    logger.info({ consultationId: id }, 'Consultation updated successfully');
    // If consultation status was changed to Completed, cascade update to appointment
    try {
      const newStatus = updateData.status;
      if (newStatus && String(newStatus).toLowerCase() === 'completed') {
        const appointmentIdentifier = consultation.appointment_id;
        if (appointmentIdentifier) {
          await Appointment.findOneAndUpdate(
            { $or: [ { _id: appointmentIdentifier }, { appointment_uid: appointmentIdentifier } ] },
            { status: 'completed' }
          );
          logger.info({ appointmentIdentifier }, 'Appointment status set to completed due to consultation completion');
        }
      }
    } catch (apptErr) {
      logger.warn({ err: apptErr, consultationId: id }, 'Failed to cascade appointment status update');
    }

    return {
      id: consultation._id.toString(),
      ...consultation.toObject()
    };
  } catch (err) {
    logger.error({ err, consultationId: id }, 'Error updating consultation');
    throw err;
  }
};

/**
 * Get all consultations by clinic ID
 */
const getConsultationsByClinicId = async (clinicId, filters = {}) => {
  try {
    const query = { clinic_id: clinicId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.patient_id) {
      query.patient_id = filters.patient_id;
    }
    if (filters.doctor_id) {
      query.doctor_id = filters.doctor_id;
    }

    const consultations = await Consultation.find(query)
      .sort({ created_at: -1 })
      .limit(filters.limit || 100)
      .skip(filters.skip || 0);

    return consultations.map(consultation => ({
      id: consultation._id.toString(),
      ...consultation.toObject()
    }));
  } catch (err) {
    logger.error({ err, clinicId }, 'Error retrieving consultations by clinic');
    throw err;
  }
};

/**
 * Get all consultations by patient ID
 */
const getConsultationsByPatientId = async (patientId, filters = {}) => {
  try {
    const query = { patient_id: patientId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.clinic_id) {
      query.clinic_id = filters.clinic_id;
    }

    const consultations = await Consultation.find(query)
      .sort({ created_at: -1 })
      .limit(filters.limit || 100)
      .skip(filters.skip || 0);

    return consultations.map(consultation => ({
      id: consultation._id.toString(),
      ...consultation.toObject()
    }));
  } catch (err) {
    logger.error({ err, patientId }, 'Error retrieving consultations by patient');
    throw err;
  }
};

/**
 * Delete consultation
 */
const deleteConsultation = async (id) => {
  try {
    const consultation = await Consultation.findByIdAndDelete(id);
    if (!consultation) {
      throw new Error("Consultation not found");
    }
    logger.info({ consultationId: id }, 'Consultation deleted successfully');
    return {
      id: consultation._id.toString(),
      ...consultation.toObject()
    };
  } catch (err) {
    logger.error({ err, consultationId: id }, 'Error deleting consultation');
    throw err;
  }
};

module.exports = {
  createConsultation,
  getConsultationById,
  getConsultationByAppointmentId,
  getOrCreateConsultation,
  updateConsultation,
  getConsultationsByClinicId,
  getConsultationsByPatientId,
  deleteConsultation
};
