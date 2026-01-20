const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Book an appointment
router.post('/', verifyToken, appointmentController.book);

// Get booked slots for a doctor on a specific date
router.get('/booked-slots', verifyToken, appointmentController.getBookedSlots);

// Get all appointments for a clinic (with optional filters)
router.get('/clinic/:clinic_id', verifyToken, appointmentController.getByClinic);

// Get a specific appointment by ID
router.get('/:id', verifyToken, appointmentController.getById);

// Update an appointment
router.put('/:id', verifyToken, appointmentController.update);

// Delete an appointment
router.delete('/:id', verifyToken, appointmentController.delete);

module.exports = router;
