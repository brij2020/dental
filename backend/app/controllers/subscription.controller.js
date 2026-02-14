const subscriptionService = require("../services/subscription.service");
const { logger } = require("../config/logger");

exports.create = async (req, res) => {
  try {
    const data = await subscriptionService.createSubscription(req.body, req.user);
    res.status(201).send({ data });
  } catch (err) {
    logger.error({ err }, "Error creating subscription");
    res.status(400).send({ message: err.message || "Error creating subscription" });
  }
};

exports.list = async (req, res) => {
  try {
    const data = await subscriptionService.getSubscriptionsForUser(req.user);
    res.status(200).send({ data });
  } catch (err) {
    logger.error({ err }, "Error retrieving subscriptions");
    res.status(500).send({ message: err.message || "Error retrieving subscriptions" });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await subscriptionService.updateSubscription(req.params.id, req.body, req.user);
    res.status(200).send({ data });
  } catch (err) {
    logger.error({ err }, "Error updating subscription");
    res.status(400).send({ message: err.message || "Error updating subscription" });
  }
};
