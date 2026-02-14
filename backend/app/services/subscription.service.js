const db = require("../models");
const Subscription = db.subscriptions;
const { logger } = require("../config/logger");

const createSubscription = async (payload, user) => {
  try {
    const isSuperAdmin = user?.role === "super_admin";
    if (!isSuperAdmin) {
      throw new Error("Unauthorized");
    }

    const subscription = new Subscription({
      name: payload.name,
      price: payload.price,
      currency: payload.currency || "INR",
      duration_days: payload.duration_days,
      features: payload.features || [],
      limits: payload.limits || {},
      status: payload.status || "Active",
      scope: "global",
      clinic_id: null,
      created_by: user.id,
      created_by_role: user.role,
    });

    return await subscription.save();
  } catch (err) {
    logger.error({ err }, "Error creating subscription");
    throw err;
  }
};

const getSubscriptionsForUser = async (user) => {
  try {
    const isSuperAdmin = user?.role === "super_admin";
    const isAdmin = user?.role === "admin";

    if (isSuperAdmin) {
      return await Subscription.find().sort({ createdAt: -1 });
    }

    if (isAdmin) {
      return await Subscription.find({
        scope: "global",
        status: "Active",
      }).sort({ createdAt: -1 });
    }

    throw new Error("Unauthorized");
  } catch (err) {
    logger.error({ err }, "Error retrieving subscriptions");
    throw err;
  }
};

const updateSubscription = async (id, payload, user) => {
  try {
    const isSuperAdmin = user?.role === "super_admin";

    if (!isSuperAdmin) {
      throw new Error("Unauthorized");
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) throw new Error("Subscription not found");

    const updateData = {
      name: payload.name ?? subscription.name,
      price: payload.price ?? subscription.price,
      currency: payload.currency ?? subscription.currency,
      duration_days: payload.duration_days ?? subscription.duration_days,
      features: payload.features ?? subscription.features,
      limits: payload.limits ?? subscription.limits,
      status: payload.status ?? subscription.status,
    };

    return await Subscription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  } catch (err) {
    logger.error({ err }, "Error updating subscription");
    throw err;
  }
};

module.exports = {
  createSubscription,
  getSubscriptionsForUser,
  updateSubscription,
};
