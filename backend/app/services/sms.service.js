const { logger } = require("../config/logger");

const SMS_API_BASE = process.env.SMS_API_BASE || "https://cloud.smsindiahub.in/vendorsms/pushsms.aspx";
const SMS_API_KEY = process.env.SMS_API_KEY || "iLryzAoPAUin48T8419f1g";
const SMS_SID = process.env.SMS_SID || "SPAIDG";
const SMS_FL = process.env.SMS_FL || "0";
const SMS_DC = process.env.SMS_DC || "0";
const SMS_GWID = process.env.SMS_GWID || "2";
const OTP_SMS_MESSAGE_TEMPLATE =
  "Dear User, Your One-Time Password {otp} for login to SPAI Labs Pvt Ltd This OTP is valid for 10 minutes. Do not share it with anyone for security reasons.";

function maskMobileNumber(mobileNumber) {
  const value = String(mobileNumber || "");
  if (value.length < 4) return "****";
  return `******${value.slice(-4)}`;
}

function maskApiKey(apiKey) {
  const value = String(apiKey || "");
  if (value.length < 8) return "****";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function normalizeMobileNumber(mobileNumber) {
  const digits = String(mobileNumber || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return null;
}

async function sendSms({ mobileNumber, message }) {
  const apiKey = SMS_API_KEY;
  const sid = SMS_SID;
  const fl = SMS_FL;
  const dc = SMS_DC;
  const gwid = SMS_GWID;

  if (!apiKey) {
    throw new Error("SMS_API_KEY is not configured");
  }

  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  if (!normalizedMobile) {
    throw new Error("Invalid mobile number format for SMS");
  }

  logger.info("Preparing SMS request", {
    smsApiBase: SMS_API_BASE,
    sid,
    fl,
    dc,
    gwid,
    mobile: maskMobileNumber(normalizedMobile),
    apiKey: maskApiKey(apiKey),
  });

  const encodedMessage = encodeURIComponent(message);
  const params = [
    `APIKey=${encodeURIComponent(apiKey)}`,
    `msisdn=${normalizedMobile}`,
    `sid=${encodeURIComponent(sid)}`,
    `msg=${encodedMessage}`,
    `fl=${encodeURIComponent(fl)}`,
    `dc=${encodeURIComponent(dc)}`,
    `gwid=${encodeURIComponent(gwid)}`,
  ];

  const requestUrl = `${SMS_API_BASE}?${params.join("&")}`;
  console.log("requestUrl",requestUrl)
  const response = await fetch(requestUrl, { method: "GET" });
  const text = await response.text();

  logger.info("SMS gateway response received", {
    status: response.status,
    ok: response.ok,
    mobile: maskMobileNumber(normalizedMobile),
    rawResponse: text,
  });

  if (!response.ok) {
    logger.error(`SMS API failed with status ${response.status}: ${text}`);
    throw new Error("Failed to send SMS");
  }

  if (/error|invalid|failed|not\s*allowed|insufficient/i.test(text)) {
    logger.warn("SMS gateway returned non-success message body", {
      mobile: maskMobileNumber(normalizedMobile),
      rawResponse: text,
    });
  }

  logger.info(`SMS sent successfully to ${maskMobileNumber(normalizedMobile)}`);
  return { success: true, raw: text };
}

function buildOtpMessage(otp) {
  return OTP_SMS_MESSAGE_TEMPLATE.replace("{otp}", otp);
}

module.exports = {
  sendSms,
  normalizeMobileNumber,
  buildOtpMessage,
};
