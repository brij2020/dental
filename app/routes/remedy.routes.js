const { verifyToken } = require("../middleware/auth.middleware");

module.exports = app => {
  const controller = require("../controllers/remedy.controller.js");
  const router = require("express").Router();

  // Create a new remedy
  router.post("/", verifyToken, controller.create);

  // Get all remedies (optionally filtered by clinic_id query param)
  router.get("/", verifyToken, controller.findAll);

  // Get remedies for a specific clinic
  router.get("/clinic/:clinic_id", verifyToken, controller.findByClinicId);

  // Get a single remedy by ID
  router.get("/:id", verifyToken, controller.findOne);

  // Update remedy by ID
  router.put("/:id", verifyToken, controller.update);

  // Update remedy by clinic_id and name
  router.put("/clinic/:clinic_id/:name", verifyToken, controller.updateByClinicAndName);

  // Delete remedy by ID
  router.delete("/:id", verifyToken, controller.delete);

  // Delete remedy by clinic_id and name
  router.delete("/clinic/:clinic_id/:name", verifyToken, controller.deleteByClinicAndName);

  app.use("/api/remedies", router);
};
