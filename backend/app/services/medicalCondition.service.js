const MedicalCondition = require("../models/medicalCondition.model");

exports.getAllConditions = async (clinicId, filters = {}) => {
  try {
    const query = { clinic_id: clinicId, is_active: true };

    const conditions = await MedicalCondition.find(query)
      .sort({ name: 1 })
      .lean();

    return conditions;
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
