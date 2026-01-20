const Remedy = require("../models/remedy.model");
const logger = require("../config/logger");

// Create a new remedy
exports.create = async (remedyData) => {
  try {
    const remedy = new Remedy(remedyData);
    return await remedy.save();
  } catch (error) {
    logger.error("Error creating remedy:", error);
    throw error;
  }
};

// Get all remedies (optionally filtered by clinic_id)
exports.findAll = async (clinic_id = null) => {
  try {
    const filter = clinic_id ? { clinic_id } : {};
    return await Remedy.find(filter).sort({ name: 1 });
  } catch (error) {
    logger.error("Error fetching remedies:", error);
    throw error;
  }
};

// Get a single remedy by ID
exports.findById = async (id) => {
  try {
    return await Remedy.findById(id);
  } catch (error) {
    logger.error("Error finding remedy by ID:", error);
    throw error;
  }
};

// Get remedy by clinic_id and name
exports.findByClinicAndName = async (clinic_id, name) => {
  try {
    return await Remedy.findOne({ clinic_id, name });
  } catch (error) {
    logger.error("Error finding remedy by clinic and name:", error);
    throw error;
  }
};

// Get all remedies for a clinic
exports.findByClinicId = async (clinic_id) => {
  try {
    return await Remedy.find({ clinic_id }).sort({ name: 1 });
  } catch (error) {
    logger.error("Error finding remedies by clinic ID:", error);
    throw error;
  }
};

// Update a remedy by ID
exports.update = async (id, updateData) => {
  try {
    return await Remedy.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    logger.error("Error updating remedy:", error);
    throw error;
  }
};

// Update a remedy by clinic_id and remedy name
exports.updateByClinicAndName = async (clinic_id, name, updateData) => {
  try {
    return await Remedy.findOneAndUpdate(
      { clinic_id, name },
      updateData,
      { new: true, runValidators: true }
    );
  } catch (error) {
    logger.error("Error updating remedy by clinic and name:", error);
    throw error;
  }
};

// Delete a remedy by ID
exports.delete = async (id) => {
  try {
    return await Remedy.findByIdAndDelete(id);
  } catch (error) {
    logger.error("Error deleting remedy:", error);
    throw error;
  }
};

// Delete remedy by clinic_id and name
exports.deleteByClinicAndName = async (clinic_id, name) => {
  try {
    return await Remedy.findOneAndDelete({ clinic_id, name });
  } catch (error) {
    logger.error("Error deleting remedy by clinic and name:", error);
    throw error;
  }
};
