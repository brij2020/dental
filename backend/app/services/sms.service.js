const { logger } = require("../config/logger");

const SMS_API_BASE = process.env.SMS_API_BASE || "http://cloud.smsindiahub.in/api/mt/SendSMS";

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
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || "WEBSMS";
  const channel = process.env.SMS_CHANNEL || "Promo";
  const route = process.env.SMS_ROUTE || "##";
  const peId = process.env.SMS_PE_ID || "##";

  if (!apiKey) {
    throw new Error("SMS_API_KEY is not configured");
  }

  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  if (!normalizedMobile) {
    throw new Error("Invalid mobile number format for SMS");
  }

  logger.info("Preparing SMS request", {
    smsApiBase: SMS_API_BASE,
    senderId,
    channel,
    route,
    peId,
    mobile: maskMobileNumber(normalizedMobile),
    apiKey: maskApiKey(apiKey),
  });

  const params = new URLSearchParams({
    APIKey: apiKey,
    senderid: senderId,
    channel,
    DCS: "0",
    flashsms: "0",
    number: normalizedMobile,
    text: message,
    route,
    PEId: peId,
  });

  const requestUrl = `${SMS_API_BASE}?${params.toString()}`;
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

module.exports = {
  sendSms,
  normalizeMobileNumber,
};
