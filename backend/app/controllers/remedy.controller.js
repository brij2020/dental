const remedyService = require("../services/remedy.service");
const { logger } = require("../config/logger");

// POST /api/remedies - Create a new remedy
exports.create = async (req, res) => {
  try {
    const { clinic_id, name, times, quantity, days, note } = req.body;

    // Validate required fields
    if (!clinic_id) {
      return res.status(400).send({ message: "clinic_id is required" });
    }
    if (!name || name.trim() === "") {
      return res.status(400).send({ message: "name is required" });
    }

    // Create remedy
    const remedy = await remedyService.create({
      clinic_id,
      name: name.trim(),
      times: times || null,
      quantity: quantity || null,
      days: days || null,
      note: note || null,
    });

    logger.info(`Remedy created: ${remedy._id}`);
    res.status(201).send({ success: true, data: remedy });
  } catch (err) {
    if (err.code === 11000) {
      // Handle unique constraint violation
      const field = Object.keys(err.keyPattern).join(", ");
      res.status(409).send({
        message: `Remedy with this ${field} already exists for this clinic.`,
      });
    } else {
      // logger.error("Error creating remedy:", err);
      res.status(500).send({ message: err.message });
    }
  }
};

// GET /api/remedies - Get all remedies (with optional filters: clinic_id, name, limit)
exports.findAll = async (req, res) => {
  try {
    const { clinic_id, name, limit } = req.query;
    const filters = { clinic_id, name, limit };
    const remedies = await remedyService.findAllWithFilters(filters);
    res.status(200).send({ success: true, data: remedies });
  } catch (err) {
    logger.error("Error fetching remedies:", err);
    res.status(500).send({ message: err.message });
  }
};

// GET /api/remedies/:id - Get a single remedy by ID
exports.findOne = async (req, res) => {
  try {
    const remedy = await remedyService.findById(req.params.id);

    if (!remedy) {
      return res.status(404).send({ message: "Remedy not found" });
    }

    res.status(200).send({ success: true, data: remedy });
  } catch (err) {
    logger.error("Error finding remedy:", err);
    res.status(500).send({ message: err.message });
  }
};

// GET /api/remedies/clinic/:clinic_id - Get all remedies for a clinic
exports.findByClinicId = async (req, res) => {
  try {
    const remedies = await remedyService.findByClinicId(req.params.clinic_id);

    res.status(200).send({ success: true, data: remedies });
  } catch (err) {
    logger.error("Error fetching remedies by clinic:", err);
    res.status(500).send({ message: err.message });
  }
};

// PUT /api/remedies/:id - Update remedy by ID
exports.update = async (req, res) => {
  try {
    const { name, times, quantity, days, note } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (times !== undefined) updateData.times = times;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (days !== undefined) updateData.days = days;
    if (note !== undefined) updateData.note = note;

    // Only allow update if remedy belongs to the clinic
    const remedy = await remedyService.findById(req.params.id);
    if (!remedy) {
      return res.status(404).send({ message: "Remedy not found" });
    }
    // Only allow update if remedy is not global or belongs to the clinic
    if (remedy.clinic_id !== req.user.clinic_id) {
      return res.status(403).send({ message: "You can only update remedies created by your clinic." });
    }

    const updatedRemedy = await remedyService.update(req.params.id, updateData);
    logger.info(`Remedy updated: ${updatedRemedy._id}`);
    res.status(200).send({ success: true, data: updatedRemedy });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern).join(", ");
      res.status(409).send({
        message: `Remedy with this ${field} already exists for this clinic.`,
      });
    } else {
      logger.error("Error updating remedy:", err);
      res.status(500).send({ message: err.message });
    }
  }
};

// PUT /api/remedies/clinic/:clinic_id/:name - Update remedy by clinic and name
exports.updateByClinicAndName = async (req, res) => {
  try {
    const { clinic_id } = req.params;
    const { name: newName, times, quantity, days, note } = req.body;
    const remedyName = req.params.name;

    const updateData = {};
    if (newName !== undefined && newName !== remedyName) {
      updateData.name = newName.trim();
    }
    if (times !== undefined) updateData.times = times;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (days !== undefined) updateData.days = days;
    if (note !== undefined) updateData.note = note;

    const remedy = await remedyService.updateByClinicAndName(
      clinic_id,
      remedyName,
      updateData
    );

    if (!remedy) {
      return res
        .status(404)
        .send({
          message: "Remedy not found for this clinic",
        });
    }

    logger.info(`Remedy updated: ${remedy._id}`);
    res.status(200).send({ success: true, data: remedy });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern).join(", ");
      res.status(409).send({
        message: `Remedy with this ${field} already exists for this clinic.`,
      });
    } else {
      logger.error("Error updating remedy:", err);
      res.status(500).send({ message: err.message });
    }
  }
};

// DELETE /api/remedies/:id - Delete remedy by ID
exports.delete = async (req, res) => {
  try {
    const remedy = await remedyService.findById(req.params.id);
    if (!remedy) {
      return res.status(404).send({ message: "Remedy not found" });
    }
    // Only allow delete if remedy is not global or belongs to the clinic
    if (remedy.clinic_id !== req.user.clinic_id) {
      return res.status(403).send({ message: "You can only delete remedies created by your clinic." });
    }
    const deletedRemedy = await remedyService.delete(req.params.id);
    logger.info(`Remedy deleted: ${deletedRemedy._id}`);
    res.status(200).send({ success: true, message: "Remedy deleted" });
  } catch (err) {
    logger.error("Error deleting remedy:", err);
    res.status(500).send({ message: err.message });
  }
};

// DELETE /api/remedies/clinic/:clinic_id/:name - Delete remedy by clinic and name
exports.deleteByClinicAndName = async (req, res) => {
  try {
    const { clinic_id } = req.params;
    const remedyName = req.params.name;

    const remedy = await remedyService.deleteByClinicAndName(
      clinic_id,
      remedyName
    );

    if (!remedy) {
      return res
        .status(404)
        .send({
          message: "Remedy not found for this clinic",
        });
    }

    logger.info(`Remedy deleted: ${remedy._id}`);
    res.status(200).send({ success: true, message: "Remedy deleted" });
  } catch (err) {
    logger.error("Error deleting remedy:", err);
    res.status(500).send({ message: err.message });
  }
};
