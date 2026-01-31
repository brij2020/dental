const Problem = require("../models/problem.model");
const logger = require("../config/logger");

exports.getAllProblems = async (req, res) => {
  try {
    const { clinic_id } = req.user;

    const problems = await Problem.find({ clinic_id })
      .sort({ created_at: -1 });

    return res.status(200).json({
      status: "success",
      message: "Problems retrieved successfully",
      data: problems
    });
  } catch (error) {
    logger.error("getAllProblems error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve problems",
      error: error.message
    });
  }
};

// --- GET PROBLEM BY ID ---
exports.getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.user;

    const problem = await Problem.findOne({
      _id: id,
      clinic_id
    });

    if (!problem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Problem retrieved successfully",
      data: problem
    });
  } catch (error) {
    logger.error("getProblemById error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve problem",
      error: error.message
    });
  }
};

// --- CREATE PROBLEM ---
exports.createProblem = async (req, res) => {
  try {
    const { clinic_id } = req.user;
    const { clinical_findings, severity, brief_description, treatment_plan, icd10_code, notes } = req.body;

    // Validation
    if (!clinical_findings || !brief_description || !treatment_plan || !icd10_code) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: clinical_findings, brief_description, treatment_plan, icd10_code"
      });
    }

    const problem = new Problem({
      clinic_id,
      clinical_findings: clinical_findings.trim(),
      severity: severity || "Moderate",
      brief_description: brief_description.trim(),
      treatment_plan: treatment_plan.trim(),
      icd10_code: icd10_code.toUpperCase().trim(),
      notes: notes ? notes.trim() : null
    });

    await problem.save();

    return res.status(201).json({
      status: "success",
      message: "Problem created successfully",
      data: problem
    });
  } catch (error) {
    logger.error("createProblem error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create problem",
      error: error.message
    });
  }
};

// --- UPDATE PROBLEM ---
exports.updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.user;
    const { clinical_findings, severity, brief_description, treatment_plan, icd10_code, notes } = req.body;

    const problem = await Problem.findOne({
      _id: id,
      clinic_id
    });

    if (!problem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found"
      });
    }

    // Update fields
    if (clinical_findings !== undefined) problem.clinical_findings = clinical_findings.trim();
    if (severity !== undefined) problem.severity = severity;
    if (brief_description !== undefined) problem.brief_description = brief_description.trim();
    if (treatment_plan !== undefined) problem.treatment_plan = treatment_plan.trim();
    if (icd10_code !== undefined) problem.icd10_code = icd10_code.toUpperCase().trim();
    if (notes !== undefined) problem.notes = notes ? notes.trim() : null;

    await problem.save();

    return res.status(200).json({
      status: "success",
      message: "Problem updated successfully",
      data: problem
    });
  } catch (error) {
    logger.error("updateProblem error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update problem",
      error: error.message
    });
  }
};

// --- DELETE PROBLEM ---
exports.deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.user;

    const problem = await Problem.findOneAndDelete({
      _id: id,
      clinic_id
    });

    if (!problem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Problem deleted successfully",
      data: problem
    });
  } catch (error) {
    logger.error("deleteProblem error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete problem",
      error: error.message
    });
  }
};
