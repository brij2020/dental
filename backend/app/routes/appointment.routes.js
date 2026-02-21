const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { throttle } = require('../middleware/throttle.middleware');
const { uploadAppointmentReport, handleUploadError } = require('../middleware/upload.middleware');

module.exports = (app) => {
	const router = express.Router();

	const publicBookLimiter = throttle({ windowMs: 60 * 1000, max: 8, scope: 'appointments-book' });
	const publicSlotLimiter = throttle({ windowMs: 60 * 1000, max: 12, scope: 'appointments-slots' });

	// Book an appointment (public endpoint - patients can book without auth)
	router.post('/', publicBookLimiter, appointmentController.book);

	// Get all appointments for authenticated patient (requires auth)
	router.get('/', verifyToken, appointmentController.getByPatient);

	// Get booked slots for a doctor on a specific date (public - needed for slot selection)
	router.get('/booked-slots', publicSlotLimiter, appointmentController.getBookedSlots);

	// Get patient appointment history with a specific doctor (requires auth)
	router.get('/patient-history/:patientId', verifyToken, appointmentController.getDoctorHistory);

	// Get all appointments for a clinic (requires auth)
	router.get('/clinic/:clinic_id', verifyToken, appointmentController.getByClinic);

	// Get a specific appointment by ID (requires auth)
	router.get('/:id', verifyToken, appointmentController.getById);

	// Upload appointment report (requires auth)
	router.put('/:id/report', verifyToken, uploadAppointmentReport.single('report'), handleUploadError, appointmentController.uploadReport);

	// Update an appointment (requires auth)
	router.put('/:id', verifyToken, appointmentController.update);

	// Delete an appointment (requires auth)
	router.delete('/:id', verifyToken, appointmentController.delete);

	app.use('/api/appointments', router);
};
