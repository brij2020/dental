const db = require("../models");
const ClinicSubscription = db.clinicSubscriptions;
const Subscription = db.subscriptions;
const { logger } = require("../config/logger");

const getActiveSubscriptionByClinicId = async (clinicId) => {
  if (!clinicId) return null;

  const now = new Date();
  const active = await ClinicSubscription.findOne({
    clinic_id: clinicId,
    status: "active",
    end_date: { $gte: now },
  }).sort({ end_date: -1 });

  if (!active) return null;
  return active;
};

const purchaseSubscription = async ({ clinicId, subscriptionId, user }) => {
  try {
    if (!clinicId) throw new Error("Clinic ID is required");
    if (!subscriptionId) throw new Error("Subscription ID is required");

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new Error("Subscription not found");
    if (subscription.status !== "Active") throw new Error("Subscription is not active");

    if (subscription.scope === "clinic" && subscription.clinic_id !== clinicId) {
      throw new Error("Subscription not available for this clinic");
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + subscription.duration_days * 24 * 60 * 60 * 1000);

    await ClinicSubscription.updateMany(
      { clinic_id: clinicId, status: "active" },
      { $set: { status: "expired" } }
    );

    const created = await ClinicSubscription.create({
      clinic_id: clinicId,
      subscription_id: subscription._id,
      status: "active",
      start_date: now,
      end_date: endDate,
      purchased_by: user?.id || null,
      name_snapshot: subscription.name,
      price_snapshot: subscription.price,
      currency_snapshot: subscription.currency,
      features_snapshot: subscription.features || [],
      limits_snapshot: subscription.limits || {},
    });

    return created;
  } catch (err) {
    logger.error({ err }, "Error purchasing subscription");
    throw err;
  }
};

const getClinicSubscriptions = async (clinicId) => {
  if (!clinicId) return [];
  return await ClinicSubscription.find({ clinic_id: clinicId }).sort({ createdAt: -1 });
};

module.exports = {
  getActiveSubscriptionByClinicId,
  purchaseSubscription,
  getClinicSubscriptions,
};
