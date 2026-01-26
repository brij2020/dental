const feeService = require("../services/fee.service");

// Create new fee
exports.create = async (req, res) => {
  try {
    const { clinic_id, doctor_id, cost_fees, gst_number, note } = req.body;
    
    if (!clinic_id || cost_fees === undefined) {
      return res.status(400).send({ message: "clinic_id and cost_fees required" });
    }

    const fee = await feeService.createFee({
      clinic_id,
      doctor_id: doctor_id || null,
      cost_fees,
      gst_number: gst_number || null,
      note: note || null
    });
    
    res.status(201).send({ success: true, data: fee });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).send({ message: "Fee already exists for this clinic and doctor combination" });
    }
    res.status(500).send({ message: err.message });
  }
};

// Update existing fee
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { cost_fees, gst_number, note } = req.body;
    
    if (cost_fees === undefined) {
      return res.status(400).send({ message: "cost_fees required" });
    }

    const fee = await feeService.updateFee(id, {
      cost_fees,
      gst_number: gst_number || null,
      note: note || null
    });
    
    if (!fee) {
      return res.status(404).send({ message: "Fee not found" });
    }
    
    res.status(200).send({ success: true, data: fee });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get fee by ID
exports.getById = async (req, res) => {
  try {
    const fee = await feeService.getFeeById(req.params.id);
    if (!fee) {
      return res.status(404).send({ message: "Fee not found" });
    }
    res.status(200).send({ success: true, data: fee });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all fees for a clinic
exports.getAllByClinicId = async (req, res) => {
  try {
    const fees = await feeService.getAllFeesByClinicId(req.params.clinic_id);
    res.status(200).send({ success: true, data: fees });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get fee by clinic_id (and optionally doctor_id) - for backward compatibility
exports.getByClinicId = async (req, res) => {
  try {
    const { clinic_id } = req.params;
    const { doctor_id } = req.query;
    const fee = await feeService.getFeeByClinicId(clinic_id, doctor_id || null);
    res.status(200).send({ success: true, data: fee });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Save/Update fee (backward compatibility - uses clinic_id + doctor_id)
exports.save = async (req, res) => {
  try {
    const { clinic_id, doctor_id, cost_fees, gst_number, note } = req.body;
    
    if (!clinic_id || cost_fees === undefined) {
      return res.status(400).send({ message: "clinic_id and cost_fees required" });
    }

    const fee = await feeService.createOrUpdateFee(clinic_id, doctor_id || null, {
      cost_fees,
      gst_number: gst_number || null,
      note: note || null
    });
    
    res.status(200).send({ success: true, data: fee });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).send({ message: "Fee already exists for this clinic and doctor combination" });
    }
    res.status(500).send({ message: err.message });
  }
};

// Delete fee by ID
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await feeService.deleteFee(id);
    if (!fee) {
      return res.status(404).send({ message: "Fee not found" });
    }
    res.status(200).send({ success: true, message: "Fee deleted" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete fee by clinic_id (backward compatibility)
exports.deleteByClinicId = async (req, res) => {
  try {
    const { clinic_id } = req.params;
    const { doctor_id } = req.query;
    const fee = await feeService.deleteFeeByClinicId(clinic_id, doctor_id || null);
    if (!fee) {
      return res.status(404).send({ message: "Fee not found" });
    }
    res.status(200).send({ success: true, message: "Fee deleted" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
