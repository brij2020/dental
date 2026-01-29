
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");
module.exports = app => {
  const profile = require("../controllers/profile.controller");
  const router = require("express").Router();

  // Create doctor profile
  router.post("/", profile.create);

  // Retrieve all active profile (public)
  router.get("/active", profile.findAllActive);

  // Retrieve all profile (clinic-filtered, requires auth)
  router.get("/", verifyToken, profile.findAll);

  // Get profiles by clinic_id (public - no auth required)
  router.get("/clinic/:clinicId", profile.findByClinic);

  // Get doctor slots (availability and slot duration)
  router.get("/:id/slots", profile.getSlots);

  // Retrieve a single doctor by id
  router.get("/:id", profile.findOne);

  // Update doctor profile by id
  router.put("/:id", verifyToken, profile.update);
  
  // Admin reset password for a profile
  router.put("/:id/reset-password", verifyToken, profile.adminResetPassword);

  // Delete doctor profile by id
  router.delete("/:id", profile.delete);

  app.use("/api/profile", router);
};
