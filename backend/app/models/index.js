const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.tutorials = require("./tutorial.model.js")
db.profiles = require("./profile.model.js")
db.clinics = require("./clinic.model.js")
db.profileArchives = require("./profileArchive.model.js")
db.clinicPanels = require("./clinicPanel.model.js")
db.patients = require("./patient.model.js")
db.medicalConditions = require("./medicalCondition.model.js")
db.appointments = require("./appointment.model.js")
db.fees = require("./fee.model.js")
db.remedies = require("./remedy.model.js")

module.exports = db;
