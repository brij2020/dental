const { verifyToken, allowRoles } = require("../middleware/auth.middleware");
const { uploadClinicLogo, handleUploadError } = require("../middleware/upload.middleware");

module.exports = app => {
  const clinic = require("../controllers/clinic.controller");
  const router = require("express").Router();

  // Create clinic with admin profile
  router.post("/create", clinic.create);

  // Create clinic (legacy endpoint)
  router.post("/", clinic.create);

  // Retrieve all clinics (public - clinic listing is public data)
  router.get("/", clinic.findAll);

  // Search clinics by name, state, city, pin, location (public)
  router.get("/search/filter", clinic.search);

  // Retrieve all active clinics (public)
  router.get("/active", clinic.findAllActive);

  // Retrieve a single clinic by id
  router.get("/information", verifyToken, clinic.findOne);
  // Public lookup (accepts ObjectId or clinic_id)
  router.get("/:id/public", clinic.findPublicById);
  router.get("/:id", verifyToken, clinic.findById);

  // Clinic information by clinic_id (public) - returns clinic + admin + doctors
  router.get("/clinic-information/:clinic_id", clinic.clinicInformation);

  // Get admin/staff schedules for a clinic (public)
  router.get("/:id/admin", clinic.getAdminSchedules);

  // Get doctor schedules for a clinic (public)
  router.get("/:id/doctors", clinic.getDoctorSchedules);

  // Get specific doctor schedule by doctor ID (public)
  router.get("/:id/doctors/:doctorId", clinic.getDoctorScheduleById);

  // Update clinic by id
  router.put("/:id", verifyToken, clinic.update);

  // Upload clinic logo/profile image
  router.post(
    "/:id/upload-logo",
    verifyToken,
    uploadClinicLogo.single("logo"),
    handleUploadError,
    clinic.uploadLogo
  );

  // Delete clinic by id
  router.delete("/:id", verifyToken, clinic.delete);

  app.use("/api/clinics", router);
  app.use("/api/clinic", router);
};
