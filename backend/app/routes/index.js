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
  require("./medicalCondition.routes")(app);
  require("./appointment.routes")(app);
  require("./procedure.routes")(app);
  require("./problem.routes")(app);
  require("./consultation.routes")(app);
  require("./treatmentProcedure.routes")(app);
  require("./analytics.routes")(app);
};


