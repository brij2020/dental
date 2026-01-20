const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

module.exports = app => {
  const patient = require("../controllers/patient.controller");
  const router = require("express").Router();

  // Create patient
  router.post("/", patient.create);

  // Get all patients for clinic with filters
  router.get("/", verifyToken, patient.findAll);

  // Check if patient exists by email
  router.get("/check-exists", verifyToken, patient.checkExists);

  // Get patient by phone
  router.get("/phone", verifyToken, patient.findByPhone);

  // Get patient by UHID
  router.get("/uhid/:uhid", verifyToken, patient.findByUhid);

  // Get patient by email
  router.get("/email/:email", verifyToken, patient.findByEmail);

  // Get patient by ID
  router.get("/:id", verifyToken, patient.findOne);

  // Update patient by ID
  router.put("/:id", verifyToken, patient.update);

  // Delete patient by ID
  router.delete("/:id", verifyToken, patient.delete);

  // Bulk delete patients
  router.post("/bulk-delete", verifyToken, patient.bulkDelete);

  app.use("/api/patient", router);
};
