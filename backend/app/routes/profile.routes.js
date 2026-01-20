
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");
module.exports = app => {
  const profile = require("../controllers/profile.controller");
  const router = require("express").Router();

  // Create doctor profile
  router.post("/", profile.create);

  // Retrieve all profile
  router.get("/", verifyToken, profile.findAll);

  // Retrieve all active profile
  router.get("/active", profile.findAllActive);

  // Get doctor slots (availability and slot duration)
  router.get("/:id/slots", profile.getSlots);

  // Retrieve a single doctor by id
  router.get("/:id", profile.findOne);

  // Update doctor profile by id
  router.put("/:id", verifyToken, profile.update);

  // Delete doctor profile by id
  router.delete("/:id", profile.delete);

  app.use("/api/profile", router);
};
