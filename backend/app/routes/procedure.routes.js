const express = require("express");
module.exports = (app) => {
	const router = express.Router();
	const procedureController = require("../controllers/procedure.controller");
	const { verifyToken } = require("../middleware/auth.middleware");

	// Apply auth middleware to all procedure routes
	router.use(verifyToken);

	// Get all procedures for a clinic
	router.get("/", procedureController.getAllProcedures);

	// Get procedure by ID
	router.get("/:id", procedureController.getProcedureById);

	// Create a new procedure
	router.post("/", procedureController.createProcedure);

	// Update a procedure
	router.put("/:id", procedureController.updateProcedure);

	// Delete a procedure
	router.delete("/:id", procedureController.deleteProcedure);

	app.use("/api/procedures", router);
};
