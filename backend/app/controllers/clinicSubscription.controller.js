const clinicSubscriptionService = require("../services/clinicSubscription.service");
const { logger } = require("../config/logger");

exports.purchase = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.role === "super_admin";
    if (!isSuperAdmin && (req.body?.clinic_id || req.query?.clinic_id)) {
      return res.status(403).send({ message: "Admins cannot specify clinic_id explicitly" });
    }

    const clinicId = isSuperAdmin ? (req.body?.clinic_id || req.query?.clinic_id) : req.user?.clinic_id;
    const subscriptionId = req.body?.subscription_id;

    const data = await clinicSubscriptionService.purchaseSubscription({
      clinicId,
      subscriptionId,
      user: req.user,
    });

    res.status(201).send({ data });
  } catch (err) {
    logger.error({ err }, "Error purchasing subscription");
    res.status(400).send({ message: err.message || "Error purchasing subscription" });
  }
};

exports.getActive = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.role === "super_admin";
    const clinicId = isSuperAdmin ? (req.query?.clinic_id || req.user?.clinic_id) : req.user?.clinic_id;
    const data = await clinicSubscriptionService.getActiveSubscriptionByClinicId(clinicId);
    res.status(200).send({ data });
  } catch (err) {
    logger.error({ err }, "Error retrieving active subscription");
    res.status(500).send({ message: err.message || "Error retrieving active subscription" });
  }
};

exports.history = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.role === "super_admin";
    const clinicId = isSuperAdmin ? (req.query?.clinic_id || req.user?.clinic_id) : req.user?.clinic_id;
    const data = await clinicSubscriptionService.getClinicSubscriptions(clinicId);
    res.status(200).send({ data });
  } catch (err) {
    logger.error({ err }, "Error retrieving subscription history");
    res.status(500).send({ message: err.message || "Error retrieving subscription history" });
  }
};
