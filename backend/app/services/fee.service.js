const Fee = require("../models/fee.model");

exports.createOrUpdateFee = async (clinic_id, doctor_id, feeData) => {
  const query = { clinic_id };
  if (doctor_id) {
    query.doctor_id = doctor_id;
  } else {
    query.doctor_id = null; // Clinic-wide fee
  }
  
  return await Fee.findOneAndUpdate(
    query,
    { ...feeData, clinic_id, doctor_id: doctor_id || null, updated_at: new Date() },
    { new: true, upsert: true, runValidators: true }
  );
};

exports.getFeeByClinicId = async (clinic_id, doctor_id = null) => {
  const query = { clinic_id };
  if (doctor_id) {
    query.doctor_id = doctor_id;
  } else {
    query.doctor_id = null; // Clinic-wide fee
  }
  return await Fee.findOne(query);
};

exports.getAllFeesByClinicId = async (clinic_id) => {
  return await Fee.find({ clinic_id }).sort({ doctor_id: 1, created_at: -1 });
};

exports.getFeeById = async (fee_id) => {
  return await Fee.findById(fee_id);
};

exports.createFee = async (feeData) => {
  // Check if clinic-wide fee already exists when creating a new one
  if (!feeData.doctor_id) {
    const existingClinicFee = await Fee.findOne({ 
      clinic_id: feeData.clinic_id, 
      doctor_id: null 
    });
    if (existingClinicFee) {
      throw new Error('A clinic-wide fee already exists for this clinic');
    }
  }
  
  const fee = new Fee({
    ...feeData,
    updated_at: new Date()
  });
  return await fee.save();
};

exports.updateFee = async (fee_id, feeData) => {
  return await Fee.findByIdAndUpdate(
    fee_id,
    { ...feeData, updated_at: new Date() },
    { new: true, runValidators: true }
  );
};

exports.deleteFee = async (fee_id) => {
  return await Fee.findByIdAndDelete(fee_id);
};

exports.deleteFeeByClinicId = async (clinic_id, doctor_id = null) => {
  const query = { clinic_id };
  if (doctor_id) {
    query.doctor_id = doctor_id;
  } else {
    query.doctor_id = null;
  }
  return await Fee.findOneAndDelete(query);
};
