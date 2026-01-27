const { verifyToken } = require("../middleware/auth.middleware");

module.exports = app => {
  const controller = require("../controllers/consultation.controller.js");
  const router = require("express").Router();

  // Create consultation
  router.post("/", verifyToken, controller.create);

  // Get consultation by ID
  router.get("/:id", verifyToken, controller.findById);

  // Get consultation by appointment ID
  router.get("/appointment/:appointmentId", verifyToken, controller.findByAppointmentId);

  // Get or create consultation by appointment ID
  router.post("/appointment/:appointmentId/get-or-create", verifyToken, controller.getOrCreate);

  // Update consultation
  router.put("/:id", verifyToken, controller.update);

  // Get consultations by clinic ID
  router.get("/clinic/:clinicId", verifyToken, controller.findByClinicId);

  // Get consultations by patient ID
  router.get("/patient/:patientId", verifyToken, controller.findByPatientId);

  // Delete consultation
  router.delete("/:id", verifyToken, controller.delete);

  app.use("/api/consultations", router);
};
