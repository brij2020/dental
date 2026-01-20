const { logger } = require("../config/logger");
const clinicPanelService = require("../services/clinicPanel.service");

/**
 * Create a new clinic panel
 */
exports.create = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.code || !req.body.clinic_id) {
      return res.status(400).send({
        message: "name, code, and clinic_id are required"
      });
    }

    // Check if panel code already exists for this clinic
    const existsPanel = await clinicPanelService.checkPanelExists(
      req.body.clinic_id,
      req.body.code
    );

    if (existsPanel) {
      return res.status(409).send({
        message: "Panel with this code already exists for the clinic"
      });
    }

    const panelData = {
      name: req.body.name,
      code: req.body.code,
      clinic_id: req.body.clinic_id,
      description: req.body.description,
      specialization: req.body.specialization,
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      dentist_ids: req.body.dentist_ids || [],
      facilities: req.body.facilities || [],
      treatment_types: req.body.treatment_types || [],
      max_daily_appointments: req.body.max_daily_appointments || 20,
      appointment_duration_minutes: req.body.appointment_duration_minutes || 30,
      opening_time: req.body.opening_time || "09:00",
      closing_time: req.body.closing_time || "18:00",
      break_time: req.body.break_time,
      working_days: req.body.working_days,
      holidays: req.body.holidays || [],
      contact_number: req.body.contact_number,
      email: req.body.email,
      location: req.body.location,
      pricing: req.body.pricing,
      notes: req.body.notes,
      status: req.body.status || "Active"
    };

    const panel = await clinicPanelService.createPanel(panelData);

    res.status(201).send({
      message: "Panel created successfully",
      data: panel
    });
  } catch (err) {
    logger.error(`Error creating panel: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error creating panel"
    });
  }
};

/**
 * Get all panels for a clinic
 */
exports.findAll = async (req, res) => {
  try {
    const filters = {
      clinic_id: req.query.clinic_id,
      is_active: req.query.is_active === "true" ? true : req.query.is_active === "false" ? false : undefined,
      status: req.query.status,
      specialization: req.query.specialization,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    // If clinic_id is not provided, get from user context (clinic staff)
    if (!filters.clinic_id && req.user?.clinic_id) {
      filters.clinic_id = req.user.clinic_id;
    }

    if (!filters.clinic_id) {
      return res.status(400).send({
        message: "clinic_id is required"
      });
    }

    const result = await clinicPanelService.getAllPanels(filters);
    res.send(result);
  } catch (err) {
    logger.error(`Error retrieving panels: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving panels"
    });
  }
};

/**
 * Get all active panels for a clinic
 */
exports.findActive = async (req, res) => {
  try {
    const clinic_id = req.query.clinic_id || req.user?.clinic_id;

    if (!clinic_id) {
      return res.status(400).send({
        message: "clinic_id is required"
      });
    }

    const panels = await clinicPanelService.getActivePanelsByClinic(clinic_id);

    res.send({
      message: "Active panels retrieved successfully",
      data: panels
    });
  } catch (err) {
    logger.error(`Error retrieving active panels: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving active panels"
    });
  }
};

/**
 * Get panel by ID
 */
exports.findOne = async (req, res) => {
  try {
    const panelId = req.params.id;

    const panel = await clinicPanelService.getPanelById(panelId);

    // Check if user has access to this panel (clinic staff can only see their clinic's panels)
    if (req.user?.clinic_id && panel.clinic_id !== req.user.clinic_id) {
      return res.status(403).send({
        message: "Unauthorized access to this panel"
      });
    }

    res.send({
      message: "Panel retrieved successfully",
      data: panel
    });
  } catch (err) {
    logger.error(`Error retrieving panel: ${err.message}`);
    res.status(err.message === "Panel not found" ? 404 : 500).send({
      message: err.message || "Error retrieving panel"
    });
  }
};

/**
 * Get panel by code
 */
exports.findByCode = async (req, res) => {
  try {
    const { clinic_id, code } = req.params;

    const panel = await clinicPanelService.getPanelByCode(clinic_id, code);

    res.send({
      message: "Panel retrieved successfully",
      data: panel
    });
  } catch (err) {
    logger.error(`Error retrieving panel by code: ${err.message}`);
    res.status(err.message === "Panel not found" ? 404 : 500).send({
      message: err.message || "Error retrieving panel"
    });
  }
};

/**
 * Get panels by specialization
 */
exports.findBySpecialization = async (req, res) => {
  try {
    const clinic_id = req.query.clinic_id || req.user?.clinic_id;
    const specialization = req.query.specialization;

    if (!clinic_id || !specialization) {
      return res.status(400).send({
        message: "clinic_id and specialization are required"
      });
    }

    const panels = await clinicPanelService.getPanelsBySpecialization(clinic_id, specialization);

    res.send({
      message: "Panels retrieved successfully",
      data: panels
    });
  } catch (err) {
    logger.error(`Error retrieving panels by specialization: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving panels"
    });
  }
};

/**
 * Update panel by ID
 */
exports.update = async (req, res) => {
  try {
    const panelId = req.params.id;

    // Verify access
    const panel = await clinicPanelService.getPanelById(panelId);
    if (req.user?.clinic_id && panel.clinic_id !== req.user.clinic_id) {
      return res.status(403).send({
        message: "Unauthorized access to this panel"
      });
    }

    // Prevent updating code (as it's unique)
    if (req.body.code && req.body.code !== panel.code) {
      return res.status(400).send({
        message: "Panel code cannot be changed"
      });
    }

    const updateData = { ...req.body };
    delete updateData.clinic_id; // Prevent clinic_id change

    const updatedPanel = await clinicPanelService.updatePanel(panelId, updateData);

    res.send({
      message: "Panel updated successfully",
      data: updatedPanel
    });
  } catch (err) {
    logger.error(`Error updating panel: ${err.message}`);
    res.status(err.message === "Panel not found" ? 404 : 500).send({
      message: err.message || "Error updating panel"
    });
  }
};

/**
 * Delete panel by ID
 */
exports.delete = async (req, res) => {
  try {
    const panelId = req.params.id;

    // Verify access
    const panel = await clinicPanelService.getPanelById(panelId);
    if (req.user?.clinic_id && panel.clinic_id !== req.user.clinic_id) {
      return res.status(403).send({
        message: "Unauthorized access to this panel"
      });
    }

    const result = await clinicPanelService.deletePanel(panelId);

    res.send(result);
  } catch (err) {
    logger.error(`Error deleting panel: ${err.message}`);
    res.status(err.message === "Panel not found" ? 404 : 500).send({
      message: err.message || "Error deleting panel"
    });
  }
};

/**
 * Add dentist to panel
 */
exports.addDentist = async (req, res) => {
  try {
    const { panelId } = req.params;
    const { dentistId } = req.body;

    if (!dentistId) {
      return res.status(400).send({
        message: "dentistId is required"
      });
    }

    // Verify access
    const panel = await clinicPanelService.getPanelById(panelId);
    if (req.user?.clinic_id && panel.clinic_id !== req.user.clinic_id) {
      return res.status(403).send({
        message: "Unauthorized access to this panel"
      });
    }

    const updatedPanel = await clinicPanelService.addDentistToPanel(panelId, dentistId);

    res.send({
      message: "Dentist added to panel successfully",
      data: updatedPanel
    });
  } catch (err) {
    logger.error(`Error adding dentist to panel: ${err.message}`);
    res.status(err.message === "Panel not found" ? 404 : 500).send({
      message: err.message || "Error adding dentist to panel"
    });
  }
};

/**
 * Remove dentist from panel
 */
exports.removeDentist = async (req, res) => {
  try {
    const { panelId } = req.params;
    const { dentistId } = req.body;

    if (!dentistId) {
      return res.status(400).send({
        message: "dentistId is required"
      });
    }

    // Verify access
    const panel = await clinicPanelService.getPanelById(panelId);
    if (req.user?.clinic_id && panel.clinic_id !== req.user.clinic_id) {
      return res.status(403).send({
        message: "Unauthorized access to this panel"
      });
    }

    const updatedPanel = await clinicPanelService.removeDentistFromPanel(panelId, dentistId);

    res.send({
      message: "Dentist removed from panel successfully",
      data: updatedPanel
    });
  } catch (err) {
    logger.error(`Error removing dentist from panel: ${err.message}`);
    res.status(err.message === "Panel not found" ? 404 : 500).send({
      message: err.message || "Error removing dentist from panel"
    });
  }
};

/**
 * Get panels with specific dentist
 */
exports.getPanelsWithDentist = async (req, res) => {
  try {
    const clinic_id = req.query.clinic_id || req.user?.clinic_id;
    const { dentistId } = req.params;

    if (!clinic_id) {
      return res.status(400).send({
        message: "clinic_id is required"
      });
    }

    const panels = await clinicPanelService.getPanelsWithDentist(clinic_id, dentistId);

    res.send({
      message: "Panels retrieved successfully",
      data: panels
    });
  } catch (err) {
    logger.error(`Error retrieving panels with dentist: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving panels"
    });
  }
};
