const { verifyToken } = require("../middleware/auth.middleware");

module.exports = app => {
  const controller = require("../controllers/fee.controller.js");
  const router = require("express").Router();

  router.post("/", verifyToken, controller.save);
  router.get("/clinic/:clinic_id", verifyToken, controller.getByClinicId);
  router.put("/clinic/:clinic_id", verifyToken, controller.save);
  router.delete("/clinic/:clinic_id", verifyToken, controller.delete);

  app.use("/api/fees", router);
};
