const medicalConditionService = require("../services/medicalCondition.service");
const logger = require("../config/logger");

// Get all medical conditions for a clinic
exports.findAll = async (req, res) => {
  try {
    const { clinic_id } = req.query;

    if (!clinic_id) {
      return res.status(400).json({
        success: false,
        message: "clinic_id is required",
      });
    }

    const conditions = await medicalConditionService.getAllConditions(clinic_id);

    res.status(200).json({
      success: true,
      message: "Medical conditions retrieved successfully",
      data: conditions,
    });
  } catch (error) {
    logger.error("Error fetching medical conditions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medical conditions",
      error: error.message,
    });
  }
};

// Get single medical condition by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;

    const condition = await medicalConditionService.getConditionById(id);

    if (!condition) {
      return res.status(404).json({
        success: false,
        message: "Medical condition not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical condition retrieved successfully",
      data: condition,
    });
  } catch (error) {
    logger.error("Error fetching medical condition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medical condition",
      error: error.message,
    });
  }
};

// Create new medical condition
exports.create = async (req, res) => {
  try {
    const { clinic_id, name, has_value, description } = req.body;

    if (!clinic_id || !name) {
      return res.status(400).json({
        success: false,
        message: "clinic_id and name are required",
      });
    }

    const conditionData = {
      clinic_id,
      name: name.trim(),
      has_value: has_value === true,
      description: description ? description.trim() : null,
      is_active: true,
    };

    const condition = await medicalConditionService.createCondition(conditionData);

    res.status(201).json({
      success: true,
      message: "Medical condition created successfully",
      data: condition,
    });
  } catch (error) {
    logger.error("Error creating medical condition:", error);

    // Handle unique constraint violation
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This medical condition already exists in your clinic",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create medical condition",
      error: error.message,
    });
  }
};

// Update medical condition
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, has_value, description, is_active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Condition ID is required",
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (has_value !== undefined) updateData.has_value = has_value === true;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (is_active !== undefined) updateData.is_active = is_active === true;

    const condition = await medicalConditionService.updateCondition(id, updateData);

    if (!condition) {
      return res.status(404).json({
        success: false,
        message: "Medical condition not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical condition updated successfully",
      data: condition,
    });
  } catch (error) {
    logger.error("Error updating medical condition:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A medical condition with this name already exists in your clinic",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update medical condition",
      error: error.message,
    });
  }
};

// Delete medical condition
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Condition ID is required",
      });
    }

    const condition = await medicalConditionService.deleteCondition(id);

    if (!condition) {
      return res.status(404).json({
        success: false,
        message: "Medical condition not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical condition deleted successfully",
      data: condition,
    });
  } catch (error) {
    logger.error("Error deleting medical condition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medical condition",
      error: error.message,
    });
  }
};
