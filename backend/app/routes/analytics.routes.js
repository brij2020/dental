const { verifyToken } = require('../middleware/auth.middleware');

module.exports = app => {
  const controller = require('../controllers/analytics.controller');
  const router = require('express').Router();

  // Overview aggregates
  router.get('/overview', verifyToken, controller.overview);
  // Trends/time-series
  router.get('/trends', verifyToken, controller.trends);

  app.use('/api/analytics', router);
};
