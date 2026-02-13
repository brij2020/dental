const db = require("../models");
const Procedure = db.procedures;
const ClinicPanel = db.clinicPanels;
const { logger } = require("../config/logger");

/**
 * Get all procedures for a clinic
 */
exports.getAllProcedures = async (req, res) => {
  try {
    const { clinic_id, page, limit } = req.query;

    if (!clinic_id) {
      return res.status(400).send({ message: "clinic_id is required" });
    }

    if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
      return res.status(400).send({
        message: "Invalid page. Expected a positive integer",
        code: "INVALID_PAGE",
      });
    }

    if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
      return res.status(400).send({
        message: "Invalid limit. Expected a positive integer",
        code: "INVALID_LIMIT",
      });
    }

    const query = { clinic_id };
    const hasPagination = page !== undefined || limit !== undefined;

    if (hasPagination) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [procedures, total] = await Promise.all([
        Procedure.find(query).sort({ created_at: -1 }).skip(skip).limit(limitNum),
        Procedure.countDocuments(query),
      ]);

      logger.info({ clinic_id, count: procedures.length, total, page: pageNum, limit: limitNum }, 'Fetched paginated procedures');
      return res.status(200).send({
        data: procedures,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    }

    const procedures = await Procedure.find(query).sort({ created_at: -1 });
    logger.info({ clinic_id, count: procedures.length }, 'Fetched procedures');
    res.status(200).send({ data: procedures });
  } catch (err) {
    logger.error({ err }, 'Error fetching procedures');
    res.status(500).send({ message: err.message });
  }
};

/**
 * Get procedure by ID
 */
exports.getProcedureById = async (req, res) => {
  try {
    const { id } = req.params;

    const procedure = await Procedure.findById(id);
    if (!procedure) {
      return res.status(404).send({ message: "Procedure not found" });
    }

    res.status(200).send({ data: procedure });
  } catch (err) {
    logger.error({ err }, 'Error fetching procedure');
    res.status(500).send({ message: err.message });
  }
};

/**
 * Create a new procedure
 */
exports.createProcedure = async (req, res) => {
  try {
    const { clinic_id, panel_id, name, procedure_type, description, cost, note } = req.body;

    if (!clinic_id || !name) {
      return res.status(400).send({ message: "clinic_id and name are required" });
    }

    // Validate cost
    if (cost !== undefined && (typeof cost !== 'number' || cost < 0)) {
      return res.status(400).send({ message: "Cost must be a non-negative number" });
    }

    if (panel_id) {
      const panel = await ClinicPanel.findById(panel_id);
      if (!panel || panel.clinic_id !== clinic_id) {
        return res.status(400).send({ message: "Invalid panel_id for this clinic" });
      }
    }

    const procedure = new Procedure({
      clinic_id,
      panel_id: panel_id || null,
      name: name.trim(),
      procedure_type: procedure_type || "General",
      description: description?.trim(),
      cost: cost || 0,
      note: note?.trim()
    });

    await procedure.save();
    logger.info({ procedureId: procedure._id, clinic_id }, 'Procedure created');
    res.status(201).send({ data: procedure });
  } catch (err) {
    logger.error({ err }, 'Error creating procedure');
    res.status(500).send({ message: err.message });
  }
};

/**
 * Update a procedure
 */
exports.updateProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, procedure_type, description, cost, note, is_active, panel_id } = req.body;

    // Validate cost
    if (cost !== undefined && (typeof cost !== 'number' || cost < 0)) {
      return res.status(400).send({ message: "Cost must be a non-negative number" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (procedure_type !== undefined) updateData.procedure_type = procedure_type;
    if (description !== undefined) updateData.description = description?.trim();
    if (cost !== undefined) updateData.cost = cost;
    if (note !== undefined) updateData.note = note?.trim();
    if (is_active !== undefined) updateData.is_active = is_active;
    if (panel_id !== undefined) {
      if (panel_id === null || panel_id === '') {
        updateData.panel_id = null;
      } else {
        const existingProcedure = await Procedure.findById(id).select("clinic_id");
        if (!existingProcedure) {
          return res.status(404).send({ message: "Procedure not found" });
        }
        const panel = await ClinicPanel.findById(panel_id);
        if (!panel || panel.clinic_id !== existingProcedure.clinic_id) {
          return res.status(400).send({ message: "Invalid panel_id for this clinic" });
        }
        updateData.panel_id = panel_id;
      }
    }

    const procedure = await Procedure.findByIdAndUpdate(id, updateData, { new: true });

    if (!procedure) {
      return res.status(404).send({ message: "Procedure not found" });
    }

    logger.info({ procedureId: id }, 'Procedure updated');
    res.status(200).send({ data: procedure });
  } catch (err) {
    logger.error({ err }, 'Error updating procedure');
    res.status(500).send({ message: err.message });
  }
};

/**
 * Delete a procedure
 */
exports.deleteProcedure = async (req, res) => {
  try {
    const { id } = req.params;

    const procedure = await Procedure.findByIdAndDelete(id);

    if (!procedure) {
      return res.status(404).send({ message: "Procedure not found" });
    }

    logger.info({ procedureId: id }, 'Procedure deleted');
    res.status(200).send({ message: "Procedure deleted successfully" });
  } catch (err) {
    logger.error({ err }, 'Error deleting procedure');
    res.status(500).send({ message: err.message });
  }
};
