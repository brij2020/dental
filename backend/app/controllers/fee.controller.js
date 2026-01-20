const feeService = require("../services/fee.service");

exports.save = async (req, res) => {
  try {
    const { clinic_id, cost_fees, gst_number, note } = req.body;
    
    if (!clinic_id || cost_fees === undefined) {
      return res.status(400).send({ message: "clinic_id and cost_fees required" });
    }

    const fee = await feeService.createOrUpdateFee(clinic_id, {
      cost_fees,
      gst_number: gst_number || null,
      note: note || null
    });
    
    res.status(200).send({ success: true, data: fee });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getByClinicId = async (req, res) => {
  try {
    const fee = await feeService.getFeeByClinicId(req.params.clinic_id);
    res.status(200).send({ success: true, data: fee });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await feeService.deleteFee(req.params.clinic_id);
    res.status(200).send({ success: true, message: "Fee deleted" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
