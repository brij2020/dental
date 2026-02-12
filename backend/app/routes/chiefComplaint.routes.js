const express = require("express");
module.exports = (app) => {
  const router = express.Router();
  const { verifyToken } = require("../middleware/auth.middleware");
  const chiefComplaintController = require("../controllers/chiefComplaint.controller");

  router.use(verifyToken);

  router.get("/public", chiefComplaintController.getAllChiefComplaintsPublic);
  router.get("/", chiefComplaintController.getAllChiefComplaints);
  router.get("/:id", chiefComplaintController.getChiefComplaintById);
  router.post("/", chiefComplaintController.createChiefComplaint);
  router.put("/:id", chiefComplaintController.updateChiefComplaint);
  router.delete("/:id", chiefComplaintController.deleteChiefComplaint);

  app.use("/api/chief-complaints", router);
};
