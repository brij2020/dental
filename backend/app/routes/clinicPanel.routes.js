const { verifyToken } = require("../middleware/auth.middleware");

module.exports = app => {
  const clinicPanel = require("../controllers/clinicPanel.controller");
  const router = require("express").Router();

  // Create clinic panel
  router.post("/", verifyToken, clinicPanel.create);

  // Get all panels for a clinic with filters
  router.get("/", verifyToken, clinicPanel.findAll);

  // Get all active panels for a clinic
  router.get("/active", verifyToken, clinicPanel.findActive);

  // Get panel by specialization
  router.get("/specialization", verifyToken, clinicPanel.findBySpecialization);

  // Get panel by code
  router.get("/code/:clinic_id/:code", verifyToken, clinicPanel.findByCode);

  // Get panels with specific dentist
  router.get("/dentist/:dentistId", verifyToken, clinicPanel.getPanelsWithDentist);

  // Get panel by ID
  router.get("/:id", verifyToken, clinicPanel.findOne);

  // Update panel by ID
  router.put("/:id", verifyToken, clinicPanel.update);

  // Delete panel by ID
  router.delete("/:id", verifyToken, clinicPanel.delete);

  // Add dentist to panel
  router.post("/:panelId/dentist/add", verifyToken, clinicPanel.addDentist);

  // Remove dentist from panel
  router.post("/:panelId/dentist/remove", verifyToken, clinicPanel.removeDentist);

  app.use("/api/clinic-panels", router);
  app.use("/api/clinicPanels", router);
};
