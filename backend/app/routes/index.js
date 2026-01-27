module.exports = app => {
  require("./turorial.routes")(app);
  require("./profile.routes")(app);
  require("./auth.routes")(app);
  require("./clinic.routes")(app);
  require("./clinicPanel.routes")(app);
  require("./patient.routes")(app);
  require("./fee.routes")(app);
  require("./remedy.routes")(app);
  require("./prescription.routes")(app);
  
  // Medical Condition Routes
  app.use("/api/medical-condition", require("./medicalCondition.routes"));
  
  // Appointment Routes
  app.use("/api/appointments", require("./appointment.routes"));
  
  // Procedure Routes
  app.use("/api/procedures", require("./procedure.routes"));
  
  // Problem Routes
  app.use("/api/problems", require("./problem.routes"));
  
  // Consultation Routes
  require("./consultation.routes")(app);
  
  // Treatment Procedure Routes
  require("./treatmentProcedure.routes")(app);
};


