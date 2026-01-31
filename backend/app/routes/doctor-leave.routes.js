const express = require('express');
const doctorLeaveController = require('../controllers/doctor-leave.controller');
const { verifyToken } = require('../middleware/auth.middleware');

module.exports = (app) => {
	const router = express.Router();

	// Create a new leave record
	router.post('/', verifyToken, doctorLeaveController.create);

	// Check if doctor is on leave for a specific date
	router.get('/check', verifyToken, doctorLeaveController.checkLeave);

	// Get all leaves for a doctor
	router.get('/doctor', verifyToken, doctorLeaveController.getByDoctor);

	// Get all leaves for a clinic
	router.get('/clinic/:clinic_id', verifyToken, doctorLeaveController.getByClinic);

	// Get a specific leave record by ID
	router.get('/:id', verifyToken, doctorLeaveController.getById);

	// Update a leave record
	router.put('/:id', verifyToken, doctorLeaveController.update);

	// Delete a leave record
	router.delete('/:id', verifyToken, doctorLeaveController.delete);

	app.use('/api/doctor-leave', router);
};
