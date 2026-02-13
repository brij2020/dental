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


// Get all remedies with optional filters: clinic_id, name (partial, case-insensitive), limit
exports.findAllWithFilters = async (filters = {}) => {
  try {
    const query = {};
    if (filters.clinic_id) {
      query.clinic_id = filters.clinic_id;
    }
    if (filters.name) {
      // Case-insensitive partial match using regex
      query.name = { $regex: filters.name, $options: 'i' };
    }
    let remedyQuery = Remedy.find(query).sort({ name: 1 });
    if (filters.limit) {
      const limitNum = parseInt(filters.limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        remedyQuery = remedyQuery.limit(limitNum);
      }
    }
    return await remedyQuery;
  } catch (error) {
    logger.error("Error fetching remedies with filters:", error);
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

// Get all remedies for a clinic, including global remedies
exports.findByClinicId = async (clinic_id, filters = {}) => {
  try {
    // Return both global and clinic-specific remedies
    const query = clinic_id !== 'system'
      ? { clinic_id: { $in: [clinic_id, 'system'] } }
      : { clinic_id };

    const hasPagination = filters.page !== undefined || filters.limit !== undefined;
    if (hasPagination) {
      const page = Math.max(1, parseInt(filters.page, 10) || 1);
      const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Remedy.find(query).sort({ name: 1 }).skip(skip).limit(limit),
        Remedy.countDocuments(query),
      ]);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }

    return await Remedy.find(query).sort({ name: 1 });
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
