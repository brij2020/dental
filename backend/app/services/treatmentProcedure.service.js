const TreatmentProcedure = require("../models/treatmentProcedure.model");
const { logger } = require("../config/logger");

/**
 * Create a new treatment procedure
 */
const createTreatmentProcedure = async (procedureData) => {
  try {
    const procedure = new TreatmentProcedure({
      consultation_id: procedureData.consultation_id,
      clinic_id: procedureData.clinic_id,
      tooth_number: procedureData.tooth_number,
      tooth_damage: procedureData.tooth_damage || "",
      problems: procedureData.problems || [],
      solutions: procedureData.solutions || [],
      cost: procedureData.cost || 0,
    });

    const savedProcedure = await procedure.save();
    logger.info({ procedureId: savedProcedure._id }, 'Treatment procedure created successfully');
    
    return {
      id: savedProcedure._id.toString(),
      ...savedProcedure.toObject()
    };
  } catch (err) {
    logger.error({ err }, 'Error creating treatment procedure');
    throw err;
  }
};

/**
 * Create multiple treatment procedures
 */
const createMultipleTreatmentProcedures = async (proceduresData) => {
  try {
    const procedures = proceduresData.map(data => ({
      consultation_id: data.consultation_id,
      clinic_id: data.clinic_id,
      tooth_number: data.tooth_number,
      tooth_damage: data.tooth_damage || "",
      problems: data.problems || [],
      solutions: data.solutions || [],
      cost: data.cost || 0,
    }));

    const savedProcedures = await TreatmentProcedure.insertMany(procedures);
    logger.info({ count: savedProcedures.length }, 'Multiple treatment procedures created');
    
    return savedProcedures.map(proc => ({
      id: proc._id.toString(),
      ...proc.toObject()
    }));
  } catch (err) {
    logger.error({ err }, 'Error creating multiple treatment procedures');
    throw err;
  }
};

/**
 * Get treatment procedure by ID
 */
const getTreatmentProcedureById = async (id) => {
  try {
    const procedure = await TreatmentProcedure.findById(id);
    if (!procedure) {
      throw new Error("Treatment procedure not found");
    }
    return {
      id: procedure._id.toString(),
      ...procedure.toObject()
    };
  } catch (err) {
    logger.error({ err, procedureId: id }, 'Error retrieving treatment procedure');
    throw err;
  }
};

/**
 * Get all treatment procedures by consultation ID
 */
const getTreatmentProceduresByConsultationId = async (consultationId) => {
  try {
    const procedures = await TreatmentProcedure.find({ consultation_id: consultationId })
      .sort({ created_at: 1 });

    return procedures.map(procedure => ({
      id: procedure._id.toString(),
      ...procedure.toObject()
    }));
  } catch (err) {
    logger.error({ err, consultationId }, 'Error retrieving treatment procedures by consultation');
    throw err;
  }
};

/**
 * Get treatment procedures by clinic ID
 */
const getTreatmentProceduresByClinicId = async (clinicId, filters = {}) => {
  try {
    const query = { clinic_id: clinicId };
    
    if (filters.consultation_id) {
      query.consultation_id = filters.consultation_id;
    }

    const procedures = await TreatmentProcedure.find(query)
      .sort({ created_at: -1 })
      .limit(filters.limit || 1000)
      .skip(filters.skip || 0);

    return procedures.map(procedure => ({
      id: procedure._id.toString(),
      ...procedure.toObject()
    }));
  } catch (err) {
    logger.error({ err, clinicId }, 'Error retrieving treatment procedures by clinic');
    throw err;
  }
};

/**
 * Update treatment procedure
 */
const updateTreatmentProcedure = async (id, updateData) => {
  try {
    const procedure = await TreatmentProcedure.findByIdAndUpdate(
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

    if (!procedure) {
      throw new Error("Treatment procedure not found");
    }

    logger.info({ procedureId: id }, 'Treatment procedure updated successfully');
    return {
      id: procedure._id.toString(),
      ...procedure.toObject()
    };
  } catch (err) {
    logger.error({ err, procedureId: id }, 'Error updating treatment procedure');
    throw err;
  }
};

/**
 * Delete treatment procedure
 */
const deleteTreatmentProcedure = async (id) => {
  try {
    const procedure = await TreatmentProcedure.findByIdAndDelete(id);
    if (!procedure) {
      throw new Error("Treatment procedure not found");
    }
    logger.info({ procedureId: id }, 'Treatment procedure deleted successfully');
    return {
      id: procedure._id.toString(),
      ...procedure.toObject()
    };
  } catch (err) {
    logger.error({ err, procedureId: id }, 'Error deleting treatment procedure');
    throw err;
  }
};

/**
 * Delete all treatment procedures by consultation ID
 */
const deleteTreatmentProceduresByConsultationId = async (consultationId) => {
  try {
    const result = await TreatmentProcedure.deleteMany({ consultation_id: consultationId });
    logger.info({ consultationId, deletedCount: result.deletedCount }, 'Treatment procedures deleted by consultation');
    return result.deletedCount;
  } catch (err) {
    logger.error({ err, consultationId }, 'Error deleting treatment procedures by consultation');
    throw err;
  }
};

module.exports = {
  createTreatmentProcedure,
  createMultipleTreatmentProcedures,
  getTreatmentProcedureById,
  getTreatmentProceduresByConsultationId,
  getTreatmentProceduresByClinicId,
  updateTreatmentProcedure,
  deleteTreatmentProcedure,
  deleteTreatmentProceduresByConsultationId
};
