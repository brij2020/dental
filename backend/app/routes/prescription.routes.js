const { verifyToken } = require("../middleware/auth.middleware");

module.exports = app => {
  const controller = require("../controllers/prescription.controller.js");
  const router = require("express").Router();

  // Get all prescriptions for a consultation
  router.get("/", verifyToken, controller.findByConsultationId);

  // Bulk save prescriptions for a consultation
  router.post("/bulk", verifyToken, controller.saveForConsultation);

  // Delete all prescriptions for a consultation
  router.delete("/", verifyToken, controller.deleteByConsultationId);

  app.use("/api/prescriptions", router);
};
