const { verifyToken } = require("../middleware/auth.middleware");

module.exports = app => {
  const controller = require("../controllers/treatmentProcedure.controller.js");
  const router = require("express").Router();

  // Create single treatment procedure
  router.post("/", verifyToken, controller.create);

  // Create multiple treatment procedures
  router.post("/bulk", verifyToken, controller.createMultiple);

  // Get treatment procedure by ID
  router.get("/:id", verifyToken, controller.findById);

  // Get all treatment procedures by consultation ID
  router.get("/consultation/:consultationId", verifyToken, controller.findByConsultationId);

  // Get all treatment procedures by clinic ID
  router.get("/clinic/:clinicId", verifyToken, controller.findByClinicId);

  // Update treatment procedure
  router.put("/:id", verifyToken, controller.update);

  // Delete treatment procedure
  router.delete("/:id", verifyToken, controller.delete);

  // Delete all treatment procedures by consultation ID
  router.delete("/consultation/:consultationId", verifyToken, controller.deleteByConsultationId);

  app.use("/api/treatment-procedures", router);
};
