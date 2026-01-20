const Fee = require("../models/fee.model");

exports.createOrUpdateFee = async (clinic_id, feeData) => {
  return await Fee.findOneAndUpdate(
    { clinic_id },
    { ...feeData, clinic_id },
    { new: true, upsert: true, runValidators: true }
  );
};

exports.getFeeByClinicId = async (clinic_id) => {
  return await Fee.findOne({ clinic_id });
};

exports.deleteFee = async (clinic_id) => {
  return await Fee.findOneAndDelete({ clinic_id });
};
