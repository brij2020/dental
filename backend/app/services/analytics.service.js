const Appointment = require('../models/appointment.model');
const Consultation = require('../models/consultation.model');
const TreatmentProcedure = require('../models/treatmentProcedure.model');
const { logger } = require('../config/logger');

const toDateRange = (yyyyMMdd) => {
  const [y, m, d] = yyyyMMdd.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { start, end };
};

const getOverview = async (clinicId, dateStr) => {
  try {
    const date = dateStr || new Date().toISOString().slice(0, 10);

    // Appointments
    const todays_appointments = await Appointment.countDocuments({ clinic_id: clinicId, appointment_date: date });

    // Monthly appointments (YYYY-MM-01 to date)
    const [yyyy, mm] = date.split('-');
    const startOfMonth = `${yyyy}-${mm}-01`;
    const monthly_appointments = await Appointment.countDocuments({
      clinic_id: clinicId,
      appointment_date: { $gte: startOfMonth, $lte: date }
    });

    // Consultations today and completed today
    const { start, end } = toDateRange(date);
    const todays_consultations = await Consultation.countDocuments({ clinic_id: clinicId, createdAt: { $gte: start, $lt: end } });
    const completed_consultations = await Consultation.countDocuments({ clinic_id: clinicId, status: 'Completed', createdAt: { $gte: start, $lt: end } });

    // Pending billing
    const pending_billing = await Consultation.countDocuments({ clinic_id: clinicId, amount_due: { $gt: 0 } });

    // Procedures today
    const procedures_today = await TreatmentProcedure.countDocuments({ clinic_id: clinicId, createdAt: { $gte: start, $lt: end } });

    return {
      date,
      todays_appointments,
      monthly_appointments,
      todays_consultations,
      completed_consultations,
      pending_billing,
      procedures_today,
      cached_at: new Date().toISOString()
    };
  } catch (err) {
    logger.error({ err, clinicId, dateStr }, 'Error computing analytics overview');
    throw err;
  }
};

module.exports = {
  getOverview,
};


/**
 * Get time-series trends for a metric grouped by day (or month)
 * metric: 'consultations' | 'appointments' | 'procedures'
 * start, end: yyyy-mm-dd
 * groupBy: 'day' | 'month'
 */
const getTrends = async (clinicId, metric, startDate, endDate, groupBy = 'day') => {
  try {
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');

    if (metric === 'consultations') {
      // group by createdAt
      const fmt = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
      const pipeline = [
        { $match: { clinic_id: clinicId, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ];
      const results = await Consultation.aggregate(pipeline).allowDiskUse(true);
      return results.map(r => ({ x: r._id, y: r.count }));
    }

    if (metric === 'appointments') {
      // appointment_date stored as YYYY-MM-DD string
      const pipeline = [
        { $match: { clinic_id: clinicId, appointment_date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$appointment_date', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ];
      const results = await Appointment.aggregate(pipeline).allowDiskUse(true);
      return results.map(r => ({ x: r._id, y: r.count }));
    }

    if (metric === 'procedures') {
      const fmt = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
      const pipeline = [
        { $match: { clinic_id: clinicId, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ];
      const results = await TreatmentProcedure.aggregate(pipeline).allowDiskUse(true);
      return results.map(r => ({ x: r._id, y: r.count }));
    }

    return [];
  } catch (err) {
    logger.error({ err, clinicId, metric, startDate, endDate }, 'Error computing analytics trends');
    throw err;
  }
};

module.exports.getTrends = getTrends;
