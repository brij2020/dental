const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const problemController = require("../controllers/problem.controller");

// All routes require authentication
router.use(verifyToken);

// GET all problems for clinic
router.get("/", problemController.getAllProblems);

// GET single problem by ID
router.get("/:id", problemController.getProblemById);

// CREATE new problem
router.post("/", problemController.createProblem);

// UPDATE problem by ID
router.put("/:id", problemController.updateProblem);

// DELETE problem by ID
router.delete("/:id", problemController.deleteProblem);

module.exports = router;
