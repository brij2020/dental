const treatmentProcedureService = require("../services/treatmentProcedure.service");
const { logger } = require("../config/logger");

/**
 * Create a new treatment procedure
 */
exports.create = async (req, res) => {
  try {
    const procedure = await treatmentProcedureService.createTreatmentProcedure(req.body);
    res.status(201).send({ success: true, data: procedure });
  } catch (err) {
    logger.error({ err }, 'Error in create treatment procedure controller');
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error creating treatment procedure" });
  }
};

/**
 * Create multiple treatment procedures
 */
exports.createMultiple = async (req, res) => {
  try {
    const { procedures } = req.body;
    if (!Array.isArray(procedures) || procedures.length === 0) {
      return res.status(400).send({ message: "procedures array is required and must not be empty" });
    }
    const createdProcedures = await treatmentProcedureService.createMultipleTreatmentProcedures(procedures);
    res.status(201).send({ success: true, data: createdProcedures });
  } catch (err) {
    logger.error({ err }, 'Error in create multiple treatment procedures controller');
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error creating treatment procedures" });
  }
};

/**
 * Get treatment procedure by ID
 */
exports.findById = async (req, res) => {
  try {
    const procedure = await treatmentProcedureService.getTreatmentProcedureById(req.params.id);
    res.status(200).send({ success: true, data: procedure });
  } catch (err) {
    logger.error({ err }, 'Error in findById treatment procedure controller');
    if (err.message === "Treatment procedure not found") {
      return res.status(404).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error retrieving treatment procedure" });
  }
};

/**
 * Get all treatment procedures by consultation ID
 */
exports.findByConsultationId = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const procedures = await treatmentProcedureService.getTreatmentProceduresByConsultationId(consultationId);
    res.status(200).send({ success: true, data: procedures });
  } catch (err) {
    logger.error({ err }, 'Error in findByConsultationId treatment procedure controller');
    res.status(500).send({ message: err.message || "Error retrieving treatment procedures" });
  }
};

/**
 * Get all treatment procedures by clinic ID
 */
exports.findByClinicId = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const filters = {
      consultation_id: req.query.consultation_id,
      limit: parseInt(req.query.limit) || 1000,
      skip: parseInt(req.query.skip) || 0
    };
    const procedures = await treatmentProcedureService.getTreatmentProceduresByClinicId(clinicId, filters);
    res.status(200).send({ success: true, data: procedures });
  } catch (err) {
    logger.error({ err }, 'Error in findByClinicId treatment procedure controller');
    res.status(500).send({ message: err.message || "Error retrieving treatment procedures" });
  }
};

/**
 * Update treatment procedure
 */
exports.update = async (req, res) => {
  try {
    const procedure = await treatmentProcedureService.updateTreatmentProcedure(req.params.id, req.body);
    res.status(200).send({ success: true, data: procedure });
  } catch (err) {
    logger.error({ err }, 'Error in update treatment procedure controller');
    if (err.message === "Treatment procedure not found") {
      return res.status(404).send({ message: err.message });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error updating treatment procedure" });
  }
};

/**
 * Delete treatment procedure
 */
exports.delete = async (req, res) => {
  try {
    await treatmentProcedureService.deleteTreatmentProcedure(req.params.id);
    res.status(200).send({ success: true, message: "Treatment procedure deleted successfully" });
  } catch (err) {
    logger.error({ err }, 'Error in delete treatment procedure controller');
    if (err.message === "Treatment procedure not found") {
      return res.status(404).send({ message: err.message });
    }
    res.status(500).send({ message: err.message || "Error deleting treatment procedure" });
  }
};

/**
 * Delete all treatment procedures by consultation ID
 */
exports.deleteByConsultationId = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const deletedCount = await treatmentProcedureService.deleteTreatmentProceduresByConsultationId(consultationId);
    res.status(200).send({ success: true, message: "Treatment procedures deleted successfully", deletedCount });
  } catch (err) {
    logger.error({ err }, 'Error in deleteByConsultationId treatment procedure controller');
    res.status(500).send({ message: err.message || "Error deleting treatment procedures" });
  }
};
