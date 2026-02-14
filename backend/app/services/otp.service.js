const crypto = require("crypto");
const db = require("../models");

const Otp = db.otps;

const OTP_TTL_MS =
  Number(process.env.OTP_TTL_MS) ||
  (Number(process.env.OTP_TTL_MINUTES) ? Number(process.env.OTP_TTL_MINUTES) * 60 * 1000 : 0) ||
  10 * 60 * 1000;

const MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = (10 ** length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

function hashOtp(otp, mobileNumber) {
  const secret = process.env.OTP_SECRET || "otp-secret";
  return crypto
    .createHash("sha256")
    .update(`${otp}:${mobileNumber}:${secret}`)
    .digest("hex");
}

async function createOtp(mobileNumber, ttlMs = OTP_TTL_MS, purpose = "login") {
  const otp = generateOtp(6);
  const expiresAt = new Date(Date.now() + ttlMs);
  const otp_hash = hashOtp(otp, mobileNumber);

  await Otp.findOneAndUpdate(
    { mobile_number: mobileNumber, purpose },
    { otp_hash, expiresAt, attempts: 0, purpose },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return otp;
}

async function verifyOtp(mobileNumber, inputOtp, purpose = "login") {
  const record = await Otp.findOne({ mobile_number: mobileNumber, purpose });
  if (!record) {
    return { valid: false, reason: "OTP_NOT_FOUND" };
  }

  if (Date.now() > record.expiresAt.getTime()) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, reason: "OTP_EXPIRED" };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, reason: "OTP_ATTEMPTS_EXCEEDED" };
  }

  const inputHash = hashOtp(String(inputOtp), mobileNumber);
  if (inputHash !== record.otp_hash) {
    record.attempts += 1;
    await record.save();
    return {
      valid: false,
      reason: "OTP_INVALID",
      attemptsLeft: Math.max(0, MAX_VERIFY_ATTEMPTS - record.attempts),
    };
  }

  await Otp.deleteOne({ _id: record._id });
  return { valid: true };
}

module.exports = {
  createOtp,
  verifyOtp,
};
