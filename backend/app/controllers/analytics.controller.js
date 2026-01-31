const analyticsService = require('../services/analytics.service');
const { logger } = require('../config/logger');

exports.overview = async (req, res) => {
  try {
    const clinicId = req.query.clinic_id || req.user?.clinic_id;
    const date = req.query.date; // yyyy-mm-dd
    if (!clinicId) return res.status(400).send({ success: false, message: 'clinic_id required' });

    const data = await analyticsService.getOverview(clinicId, date);
    res.status(200).send({ success: true, data, meta: { cached_at: data.cached_at, ttl_seconds: 60 } });
  } catch (err) {
    logger.error({ err }, 'Error in analytics overview controller');
    res.status(500).send({ success: false, message: err.message || 'Error computing analytics' });
  }
};

exports.trends = async (req, res) => {
  try {
    const clinicId = req.query.clinic_id || req.user?.clinic_id;
    const metric = req.query.metric || 'consultations';
    const start = req.query.start; // yyyy-mm-dd
    const end = req.query.end; // yyyy-mm-dd
    const groupBy = req.query.group_by || 'day';

    if (!clinicId) return res.status(400).send({ success: false, message: 'clinic_id required' });
    if (!start || !end) return res.status(400).send({ success: false, message: 'start and end required' });

    const data = await require('../services/analytics.service').getTrends(clinicId, metric, start, end, groupBy);
    res.status(200).send({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'Error in analytics trends controller');
    res.status(500).send({ success: false, message: err.message || 'Error computing trends' });
  }
};
