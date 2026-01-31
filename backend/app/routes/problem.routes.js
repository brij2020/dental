const express = require("express");
module.exports = (app) => {
	const router = express.Router();
	const { verifyToken } = require("../middleware/auth.middleware");
	const problemController = require("../controllers/problem.controller");

	router.use(verifyToken);

	router.get("/", problemController.getAllProblems);

	router.get("/:id", problemController.getProblemById);

	router.post("/", problemController.createProblem);

	router.put("/:id", problemController.updateProblem);

	router.delete("/:id", problemController.deleteProblem);

	app.use("/api/problems", router);
};
