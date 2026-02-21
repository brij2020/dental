const Remedy = require("../models/remedy.model");
const Clinic = require("../models/clinic.model");
const logger = require("../config/logger");

const SYSTEM_CLINIC_IDS = ["system", "SYSTEM", "System"];
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const resolveClinicAliases = async (clinicIdRaw) => {
  const clinicId = typeof clinicIdRaw === "string" ? clinicIdRaw.trim() : "";
  if (!clinicId) return [];

  const aliases = new Set([clinicId]);

  try {
    if (OBJECT_ID_REGEX.test(clinicId)) {
      const clinicByObjectId = await Clinic.findById(clinicId).select("clinic_id").lean();
      if (clinicByObjectId?.clinic_id) aliases.add(String(clinicByObjectId.clinic_id).trim());
    } else {
      const clinicByBusinessId = await Clinic.findOne({ clinic_id: clinicId }).select("_id clinic_id").lean();
      if (clinicByBusinessId?._id) aliases.add(String(clinicByBusinessId._id));
      if (clinicByBusinessId?.clinic_id) aliases.add(String(clinicByBusinessId.clinic_id).trim());
    }
  } catch (err) {
    logger.warn("Failed to resolve clinic aliases for remedies", { clinicId, err: err?.message || err });
  }

  return Array.from(aliases);
};

const buildClinicScopeQuery = async (clinicIdRaw) => {
  const inputIds = Array.isArray(clinicIdRaw) ? clinicIdRaw : [clinicIdRaw];
  const normalizedIds = inputIds
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  if (normalizedIds.length === 0) return null;
  if (normalizedIds.some((id) => SYSTEM_CLINIC_IDS.includes(id))) {
    return { $in: SYSTEM_CLINIC_IDS };
  }

  const aliases = new Set();
  for (const id of normalizedIds) {
    const clinicAliases = await resolveClinicAliases(id);
    clinicAliases.forEach((alias) => aliases.add(alias));
  }

  return { $in: [...aliases, ...SYSTEM_CLINIC_IDS] };
};

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
      const clinicScope = await buildClinicScopeQuery(filters.clinic_id);
      if (clinicScope) query.clinic_id = clinicScope;
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
    const clinicScope = await buildClinicScopeQuery(clinic_id);
    const query = clinicScope ? { clinic_id: clinicScope } : {};

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
