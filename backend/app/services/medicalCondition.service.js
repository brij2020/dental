const MedicalCondition = require("../models/medicalCondition.model");

exports.getAllConditions = async (clinicId, filters = {}) => {
  try {
    let query;
    if (clinicId && clinicId !== 'system') {
      query = { clinic_id: { $in: [clinicId, 'system'] }, is_active: true };
    } else {
      query = { clinic_id: 'system', is_active: true };
    }

    const conditions = await MedicalCondition.find(query)
      .sort({ name: 1 })
      .lean();

    let normalizedConditions = conditions;
    if (clinicId && clinicId !== 'system') {
      const conditionMap = new Map();

      for (const condition of conditions) {
        const key = (condition.name || '').trim().toLowerCase();
        const existing = conditionMap.get(key);
        const isClinicSpecific = condition.clinic_id === clinicId;

        if (!existing) {
          conditionMap.set(key, condition);
          continue;
        }

        if (existing.clinic_id !== clinicId && isClinicSpecific) {
          conditionMap.set(key, condition);
        }
      }

      normalizedConditions = Array.from(conditionMap.values()).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );
    }

    const hasPagination = filters.page !== undefined || filters.limit !== undefined;
    if (hasPagination) {
      const page = Math.max(1, parseInt(filters.page, 10) || 1);
      const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
      const total = normalizedConditions.length;
      const skip = (page - 1) * limit;

      return {
        data: normalizedConditions.slice(skip, skip + limit),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }

    return normalizedConditions;
  } catch (error) {
    throw error;
  }
};

exports.getConditionById = async (id) => {
  try {
    const condition = await MedicalCondition.findById(id).lean();
    return condition;
  } catch (error) {
    throw error;
  }
};

exports.createCondition = async (data) => {
  try {
    const condition = new MedicalCondition(data);
    await condition.save();
    return condition.toObject();
  } catch (error) {
    throw error;
  }
};

exports.updateCondition = async (id, data) => {
  try {
    const condition = await MedicalCondition.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
    return condition;
  } catch (error) {
    throw error;
  }
};

exports.deleteCondition = async (id) => {
  try {
    // Hard delete
    const result = await MedicalCondition.findByIdAndDelete(id);
    return result;
  } catch (error) {
    throw error;
  }
};

exports.deleteConditionsByClinic = async (clinicId) => {
  try {
    const result = await MedicalCondition.deleteMany({ clinic_id: clinicId });
    return result;
  } catch (error) {
    throw error;
  }
};
