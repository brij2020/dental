const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

module.exports = app => {
  const subscription = require("../controllers/subscription.controller");
  const router = require("express").Router();

  router.get("/", verifyToken, allowRoles("super_admin", "admin"), subscription.list);
  router.post("/", verifyToken, allowRoles("super_admin"), subscription.create);
  router.put("/:id", verifyToken, allowRoles("super_admin"), subscription.update);

  app.use("/api/subscriptions", router);
};
