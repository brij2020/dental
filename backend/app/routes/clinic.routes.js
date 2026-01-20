const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

module.exports = app => {
  const clinic = require("../controllers/clinic.controller");
  const router = require("express").Router();

  // Create clinic with admin profile
  router.post("/create", clinic.create);

  // Create clinic (legacy endpoint)
  router.post("/", clinic.create);

  // Retrieve all clinics
  router.get("/", verifyToken, clinic.findAll);

  // Retrieve all active clinics
  router.get("/active", clinic.findAllActive);

  // Retrieve a single clinic by id
  router.get("/information", verifyToken, clinic.findOne);

  // Update clinic by id
  router.put("/:id", verifyToken, clinic.update);

  // Delete clinic by id
  router.delete("/:id", verifyToken, clinic.delete);

  app.use("/api/clinics", router);
  app.use("/api/clinic", router);
};
