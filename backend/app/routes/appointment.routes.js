const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Book an appointment (public endpoint - patients can book without auth)
router.post('/', appointmentController.book);

// Get all appointments for authenticated patient (requires auth)
router.get('/', verifyToken, appointmentController.getByPatient);

// Get booked slots for a doctor on a specific date (public - needed for slot selection)
router.get('/booked-slots', appointmentController.getBookedSlots);

// Get patient appointment history with a specific doctor (requires auth)
router.get('/patient-history/:patientId', verifyToken, appointmentController.getDoctorHistory);

// Get all appointments for a clinic (requires auth)
router.get('/clinic/:clinic_id', verifyToken, appointmentController.getByClinic);

// Get a specific appointment by ID (requires auth)
router.get('/:id', verifyToken, appointmentController.getById);

// Update an appointment (requires auth)
router.put('/:id', verifyToken, appointmentController.update);

// Delete an appointment (requires auth)
router.delete('/:id', verifyToken, appointmentController.delete);

module.exports = router;
