const ChiefComplaint = require("../models/chiefComplaint.model");
const logger = require("../config/logger");

exports.getAllChiefComplaints = async (req, res) => {
  try {
    const { clinic_id } = req.user;
    const { page, limit } = req.query;

    if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid page. Expected a positive integer",
        code: "INVALID_PAGE",
      });
    }

    if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid limit. Expected a positive integer",
        code: "INVALID_LIMIT",
      });
    }

    const query = { clinic_id };
    const hasPagination = page !== undefined || limit !== undefined;
    if (hasPagination) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [complaints, total] = await Promise.all([
        ChiefComplaint.find(query).sort({ created_at: -1 }).skip(skip).limit(limitNum),
        ChiefComplaint.countDocuments(query),
      ]);

      return res.status(200).json({
        status: "success",
        message: "Chief complaints retrieved successfully",
        data: complaints,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    }

    const complaints = await ChiefComplaint.find(query).sort({ created_at: -1 });

    return res.status(200).json({
      status: "success",
      message: "Chief complaints retrieved successfully",
      data: complaints
    });
  } catch (error) {
    logger.error("getAllChiefComplaints error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve chief complaints",
      error: error.message
    });
  }
};

exports.getAllChiefComplaintsPublic = async (req, res) => {
  try {
    const complaints = await ChiefComplaint.find({}).sort({ created_at: -1 });

    return res.status(200).json({
      status: "success",
      message: "Chief complaints retrieved successfully",
      data: complaints
    });
  } catch (error) {
    logger.error("getAllChiefComplaints error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve chief complaints",
      error: error.message
    });
  }
};

exports.getChiefComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.user;

    const complaint = await ChiefComplaint.findOne({
      _id: id,
      clinic_id
    });

    if (!complaint) {
      return res.status(404).json({
        status: "error",
        message: "Chief complaint not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Chief complaint retrieved successfully",
      data: complaint
    });
  } catch (error) {
    logger.error("getChiefComplaintById error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve chief complaint",
      error: error.message
    });
  }
};

exports.createChiefComplaint = async (req, res) => {
  try {
    const { clinic_id } = req.user;
    const { name, value } = req.body;

    if (!name || !value) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: name, value"
      });
    }

    const complaint = new ChiefComplaint({
      clinic_id,
      name: name.trim(),
      value: value.trim()
    });

    await complaint.save();

    return res.status(201).json({
      status: "success",
      message: "Chief complaint created successfully",
      data: complaint
    });
  } catch (error) {
    logger.error("createChiefComplaint error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Chief complaint already exists for this clinic"
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to create chief complaint",
      error: error.message
    });
  }
};

exports.updateChiefComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.user;
    const { name, value, is_active } = req.body;

    const complaint = await ChiefComplaint.findOne({
      _id: id,
      clinic_id
    });

    if (!complaint) {
      return res.status(404).json({
        status: "error",
        message: "Chief complaint not found"
      });
    }

    if (name !== undefined) complaint.name = name.trim();
    if (value !== undefined) complaint.value = value.trim();
    if (is_active !== undefined) complaint.is_active = is_active;

    await complaint.save();

    return res.status(200).json({
      status: "success",
      message: "Chief complaint updated successfully",
      data: complaint
    });
  } catch (error) {
    logger.error("updateChiefComplaint error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "A chief complaint with this name already exists in your clinic"
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to update chief complaint",
      error: error.message
    });
  }
};

exports.deleteChiefComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.user;

    const complaint = await ChiefComplaint.findOneAndDelete({
      _id: id,
      clinic_id
    });

    if (!complaint) {
      return res.status(404).json({
        status: "error",
        message: "Chief complaint not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Chief complaint deleted successfully",
      data: complaint
    });
  } catch (error) {
    logger.error("deleteChiefComplaint error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete chief complaint",
      error: error.message
    });
  }
};
