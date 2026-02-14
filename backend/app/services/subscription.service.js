const db = require("../models");
const Subscription = db.subscriptions;
const { logger } = require("../config/logger");

const ALLOWED_LIMIT_KEYS = [
  "max_doctors",
  "max_staff",
  "max_branches",
  "max_appointments",
  "max_patients",
];

const ensurePositiveNumber = (value, field) => {
  if (value == null || value === "") {
    throw new Error(`${field} is required and must be a positive number`);
  }
  const numberValue = Number(value);
  if (Number.isNaN(numberValue) || numberValue < 0) {
    throw new Error(`${field} must be a valid non-negative number`);
  }
  return numberValue;
};

const sanitizeLimits = (limits = {}) => {
  const sanitized = {};
  ALLOWED_LIMIT_KEYS.forEach((key) => {
    if (limits[key] != null) {
      const numberValue = Number(limits[key]);
      if (!Number.isNaN(numberValue) && numberValue >= 0) {
        sanitized[key] = Math.floor(numberValue);
      }
    }
  });
  return sanitized;
};

const createSubscription = async (payload, user) => {
  try {
    const isSuperAdmin = user?.role === "super_admin";
    if (!isSuperAdmin) {
      throw new Error("Unauthorized");
    }

    const name = String(payload.name || "").trim();
    if (!name) {
      throw new Error("Subscription name is required");
    }

    const price = ensurePositiveNumber(payload.price, "price");
    const durationDays = ensurePositiveNumber(payload.duration_days, "duration_days");

    const status = payload.status || "Active";

    const subscription = new Subscription({
      name,
      price,
      currency: payload.currency || "INR",
      duration_days: durationDays,
      features: Array.isArray(payload.features) ? payload.features : [],
      limits: sanitizeLimits(payload.limits),
      status,
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

    const updateData = {};

    if (payload.name != null) {
      const trimmedName = String(payload.name).trim();
      if (!trimmedName) {
        throw new Error("Subscription name cannot be empty");
      }
      updateData.name = trimmedName;
    }

    if (payload.price != null) {
      updateData.price = ensurePositiveNumber(payload.price, "price");
    }

    if (payload.duration_days != null) {
      updateData.duration_days = ensurePositiveNumber(payload.duration_days, "duration_days");
    }

    if (payload.currency != null) {
      updateData.currency = payload.currency;
    }

    if (payload.features != null) {
      updateData.features = Array.isArray(payload.features) ? payload.features : subscription.features;
    }

    if (payload.limits != null) {
      updateData.limits = sanitizeLimits(payload.limits);
    }

    if (payload.status != null) {
      updateData.status = payload.status;
    }

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
