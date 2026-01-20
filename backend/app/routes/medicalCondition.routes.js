const express = require("express");
const router = express.Router();
const medicalConditionController = require("../controllers/medicalCondition.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Get all medical conditions for a clinic (no auth required for reading)
router.get("/", medicalConditionController.findAll);

// Get single medical condition by ID
router.get("/:id", medicalConditionController.findOne);

// Create new medical condition (requires auth)
router.post("/", verifyToken, medicalConditionController.create);

// Update medical condition (requires auth)
router.put("/:id", verifyToken, medicalConditionController.update);

// Delete medical condition (requires auth)
router.delete("/:id", verifyToken, medicalConditionController.delete);

module.exports = router;
