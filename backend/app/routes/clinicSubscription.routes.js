const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

module.exports = app => {
  const clinicSubscription = require("../controllers/clinicSubscription.controller");
  const router = require("express").Router();

  router.post("/purchase", verifyToken, allowRoles("super_admin", "admin"), clinicSubscription.purchase);
  router.get("/active", verifyToken, allowRoles("super_admin", "admin"), clinicSubscription.getActive);
  router.get("/history", verifyToken, allowRoles("super_admin", "admin"), clinicSubscription.history);

  app.use("/api/clinic-subscriptions", router);
};
