const { logger } = require("../config/logger");
const ClinicPanel = require("../models/clinicPanel.model");

/**
 * Create a new clinic panel
 */
exports.createPanel = async (panelData) => {
  try {
    const panel = new ClinicPanel(panelData);
    const savedPanel = await panel.save();
    logger.info(`Clinic panel created: ${savedPanel._id}`);
    return savedPanel;
  } catch (error) {
    logger.error(`Error creating clinic panel: ${error.message}`);
    throw error;
  }
};

/**
 * Get all clinic panels with filters
 */
exports.getAllPanels = async (filters = {}) => {
  try {
    const query = {};

    // Filter by clinic ID
    if (filters.clinic_id) {
      query.clinic_id = filters.clinic_id;
    }

    // Filter by active status
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter by specialization
    if (filters.specialization) {
      query.specialization = filters.specialization;
    }

    // Search by name or code
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { code: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } }
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const panels = await ClinicPanel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ClinicPanel.countDocuments(query);

    logger.info(`Retrieved ${panels.length} clinic panels`);
    return {
      data: panels,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error retrieving clinic panels: ${error.message}`);
    throw error;
  }
};

/**
 * Get panel by ID
 */
exports.getPanelById = async (panelId) => {
  try {
    const panel = await ClinicPanel.findById(panelId);
    if (!panel) {
      throw new Error("Panel not found");
    }
    logger.info(`Retrieved panel: ${panelId}`);
    return panel;
  } catch (error) {
    logger.error(`Error retrieving panel: ${error.message}`);
    throw error;
  }
};

/**
 * Get panel by code
 */
exports.getPanelByCode = async (clinic_id, code) => {
  try {
    const panel = await ClinicPanel.findOne({ clinic_id, code });
    if (!panel) {
      throw new Error("Panel not found");
    }
    logger.info(`Retrieved panel by code: ${code}`);
    return panel;
  } catch (error) {
    logger.error(`Error retrieving panel by code: ${error.message}`);
    throw error;
  }
};

/**
 * Get all active panels for a clinic
 */
exports.getActivePanelsByClinic = async (clinic_id) => {
  try {
    const panels = await ClinicPanel.find({
      clinic_id,
      is_active: true,
      status: "Active"
    }).sort({ name: 1 });

    logger.info(`Retrieved ${panels.length} active panels for clinic: ${clinic_id}`);
    return panels;
  } catch (error) {
    logger.error(`Error retrieving active panels: ${error.message}`);
    throw error;
  }
};

/**
 * Get panels by specialization
 */
exports.getPanelsBySpecialization = async (clinic_id, specialization) => {
  try {
    const panels = await ClinicPanel.find({
      clinic_id,
      specialization,
      is_active: true
    }).sort({ name: 1 });

    logger.info(`Retrieved ${panels.length} panels for specialization: ${specialization}`);
    return panels;
  } catch (error) {
    logger.error(`Error retrieving panels by specialization: ${error.message}`);
    throw error;
  }
};

/**
 * Update panel by ID
 */
exports.updatePanel = async (panelId, updateData) => {
  try {
    const panel = await ClinicPanel.findByIdAndUpdate(
      panelId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!panel) {
      throw new Error("Panel not found");
    }

    logger.info(`Panel updated: ${panelId}`);
    return panel;
  } catch (error) {
    logger.error(`Error updating panel: ${error.message}`);
    throw error;
  }
};

/**
 * Delete panel by ID
 */
exports.deletePanel = async (panelId) => {
  try {
    const panel = await ClinicPanel.findByIdAndDelete(panelId);

    if (!panel) {
      throw new Error("Panel not found");
    }

    logger.info(`Panel deleted: ${panelId}`);
    return { message: "Panel deleted successfully", deletedPanel: panel };
  } catch (error) {
    logger.error(`Error deleting panel: ${error.message}`);
    throw error;
  }
};

/**
 * Add dentist to panel
 */
exports.addDentistToPanel = async (panelId, dentistId) => {
  try {
    const panel = await ClinicPanel.findByIdAndUpdate(
      panelId,
      { $addToSet: { dentist_ids: dentistId } },
      { new: true }
    );

    if (!panel) {
      throw new Error("Panel not found");
    }

    logger.info(`Dentist ${dentistId} added to panel ${panelId}`);
    return panel;
  } catch (error) {
    logger.error(`Error adding dentist to panel: ${error.message}`);
    throw error;
  }
};

/**
 * Remove dentist from panel
 */
exports.removeDentistFromPanel = async (panelId, dentistId) => {
  try {
    const panel = await ClinicPanel.findByIdAndUpdate(
      panelId,
      { $pull: { dentist_ids: dentistId } },
      { new: true }
    );

    if (!panel) {
      throw new Error("Panel not found");
    }

    logger.info(`Dentist ${dentistId} removed from panel ${panelId}`);
    return panel;
  } catch (error) {
    logger.error(`Error removing dentist from panel: ${error.message}`);
    throw error;
  }
};

/**
 * Get panels with dentist
 */
exports.getPanelsWithDentist = async (clinic_id, dentistId) => {
  try {
    const panels = await ClinicPanel.find({
      clinic_id,
      dentist_ids: dentistId,
      is_active: true
    });

    logger.info(`Retrieved ${panels.length} panels for dentist ${dentistId}`);
    return panels;
  } catch (error) {
    logger.error(`Error retrieving panels for dentist: ${error.message}`);
    throw error;
  }
};

/**
 * Check if panel exists
 */
exports.checkPanelExists = async (clinic_id, code) => {
  try {
    const panel = await ClinicPanel.findOne({ clinic_id, code });
    return !!panel;
  } catch (error) {
    logger.error(`Error checking panel existence: ${error.message}`);
    throw error;
  }
};
