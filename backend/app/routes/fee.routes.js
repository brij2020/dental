const { verifyToken } = require("../middleware/auth.middleware");

module.exports = app => {
  const controller = require("../controllers/fee.controller.js");
  const router = require("express").Router();

  // New routes with ID-based operations
  router.post("/", verifyToken, controller.create);
  router.get("/clinic/:clinic_id/all", verifyToken, controller.getAllByClinicId);
  router.get("/:id", verifyToken, controller.getById);
  router.put("/:id", verifyToken, controller.update);
  router.delete("/:id", verifyToken, controller.delete);

  // Backward compatibility routes
  router.post("/save", verifyToken, controller.save);
  router.get("/clinic/:clinic_id", verifyToken, controller.getByClinicId);
  router.put("/clinic/:clinic_id", verifyToken, controller.save);
  router.delete("/clinic/:clinic_id", verifyToken, controller.deleteByClinicId);

  app.use("/api/fees", router);
};
