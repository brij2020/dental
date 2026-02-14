const db = require("../models");
const Profile = db.profiles;
const Patient = db.patients;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto")
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const { logger } = require("../config/logger");
const emailService = require('../services/email.service');
const otpService = require("../services/otp.service");
const smsService = require("../services/sms.service");
const JWT_ISSUER = process.env.JWT_ISSUER || "dental-system";

function maskMobileNumber(mobileNumber) {
    const value = String(mobileNumber || "");
    if (value.length < 4) return "****";
    return `******${value.slice(-4)}`;
}

function getPatientOtpKey(patientId) {
    return `patient:${String(patientId)}`;
}

function getStaffOtpKey(userId) {
    return `staff:${String(userId)}`;
}

async function sendPatientOtpViaPreferredChannel({ identifier, patient, otp, purpose }) {
    const isEmailIdentifier = String(identifier || "").includes("@");

    if (isEmailIdentifier) {
        if (!patient.email) {
            throw new Error("Email is not available for this account");
        }

        const subject = purpose === "login" ? "Your Login OTP" : "Your Password Reset OTP";
        const text = `Your OTP is ${otp}. It is valid for 10 minutes.`;
        const html = `<p>Your OTP is <b>${otp}</b>.</p><p>It is valid for 10 minutes.</p>`;
        await sendEmail({ to: patient.email, subject, text, html });
        return;
    }

    if (!patient.contact_number) {
        throw new Error("Mobile number is not available for this account");
    }

    const normalizedMobile = smsService.normalizeMobileNumber(patient.contact_number);
    if (!normalizedMobile) {
        throw new Error("Registered mobile number is invalid");
    }

    const tenDigitMobile = normalizedMobile.slice(-10);
    const smsText = smsService.buildOtpMessage(otp);
    await smsService.sendSms({ mobileNumber: tenDigitMobile, message: smsText });
}
/**
 * Register (Doctor / Admin)
 */
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, clinic_id, role, mobile_number } = req.body;

        if (!email || !password || !full_name || !mobile_number) {
            return res.status(400).send({ message: "Required fields missing" });
        }

        const normalizedMobile = smsService.normalizeMobileNumber(mobile_number);
        if (!normalizedMobile) {
            return res.status(400).send({ message: "Invalid mobile number format" });
        }

        const tenDigitMobile = normalizedMobile.slice(-10);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new Profile({
            email,
            password: hashedPassword,
            full_name,
            clinic_id,
            role: role || "doctor",
            mobile_number: tenDigitMobile
        });

        await user.save();

        logger.info({ userId: user._id, mobile: maskMobileNumber(tenDigitMobile) }, "User registered with mobile number");
        res.status(201).send({ message: "User registered successfully" });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            const message = field === "mobile_number" ? "Mobile number already exists" : "Email already exists";
            return res.status(409).send({ message });
        }
        res.status(500).send({ message: err.message });
    }
};

/**
 * Login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ message: "Email and password are required" });
        }
        console.log("email password",email,password);
        const user = await Profile.findOne({ email: email.toLowerCase().trim() }).select("+password");
        console.log("user",user);
        if (!user) {
            logger.warn({ email }, 'Login failed: user not found');
            return res.status(401).send({ message: "Invalid email or password" });
        }

        if (!user.password) {
            logger.warn({ userId: user._id, email }, 'Login failed: no password set');
            return res.status(401).send({ message: "Invalid email or password" });
        }
        console.log("user.password",user.password);
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn({ userId: user._id, email }, 'Login failed: invalid password');
            return res.status(401).send({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, clinic_id: user.clinic_id, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: "1d", issuer: JWT_ISSUER }
        );

        logger.info({ userId: user._id, email }, 'Login successful');
        res.status(200).send({
            token,
            role: user.role,
            id: user._id,
            clinic_id: user.clinic_id,
            full_name: user.full_name
        });
    } catch (err) {
        logger.error({ err }, 'Login error');
        res.status(401).send({ message: "Invalid email or password" });
    }
};

/**
 * Send mobile OTP for staff login
 */
exports.sendMobileOtp = async (req, res) => {
    try {
        const identifier = req.body?.identifier || req.body?.mobile_number;
        if (!identifier) {
            return res.status(400).send({ message: "identifier (email or mobile) is required" });
        }

        const rawIdentifier = String(identifier).trim();
        let user = null;
        let tenDigitMobile = null;
        const isEmailIdentifier = rawIdentifier.includes("@");

        if (isEmailIdentifier) {
            user = await Profile.findOne({ email: rawIdentifier.toLowerCase() });
            if (!user) {
                logger.warn({ email: rawIdentifier.toLowerCase() }, "OTP request failed: user not found for email");
                return res.status(404).send({ message: "User not found for this email" });
            }
        } else {
            const normalizedMobile = smsService.normalizeMobileNumber(rawIdentifier);
            if (!normalizedMobile) {
                logger.warn({ mobile: maskMobileNumber(rawIdentifier) }, "Invalid mobile number format for OTP request");
                return res.status(400).send({ message: "Invalid mobile number format" });
            }

            tenDigitMobile = normalizedMobile.slice(-10);
            user = await Profile.findOne({ mobile_number: tenDigitMobile });
            if (!user) {
                logger.warn({ mobile: maskMobileNumber(tenDigitMobile) }, "OTP request failed: user not found for mobile number");
                return res.status(404).send({ message: "User not found for this mobile number" });
            }
        }

        const otpKey = getStaffOtpKey(user._id);
        const otp = await otpService.createOtp(otpKey, undefined, "login");
        let gatewayResponse = null;
        if (isEmailIdentifier) {
            const subject = "Your Login OTP";
            const text = `Your OTP is ${otp}. It is valid for 10 minutes.`;
            const html = `<p>Your OTP is <b>${otp}</b>.</p><p>It is valid for 10 minutes.</p>`;
            await emailService.sendEmail({ to: user.email, subject, text, html });
        } else if (tenDigitMobile) {
            const smsText = smsService.buildOtpMessage(otp);
            const smsResult = await smsService.sendSms({ mobileNumber: tenDigitMobile, message: smsText });
            gatewayResponse = smsResult?.raw;
        }

        logger.info({
            userId: user._id,
            identifierType: isEmailIdentifier ? "email" : "mobile",
            mobile: tenDigitMobile ? maskMobileNumber(tenDigitMobile) : undefined,
            gatewayResponse,
        }, "Mobile OTP sent");
        return res.status(200).send({ message: "OTP sent successfully" });
    } catch (err) {
        logger.error({ err }, "Error sending mobile OTP");
        return res.status(500).send({ message: err.message || "Failed to send OTP" });
    }
};

/**
 * Verify mobile OTP and login
 */
exports.verifyMobileOtp = async (req, res) => {
    try {
        const identifier = req.body?.identifier || req.body?.mobile_number;
        const { otp } = req.body;
        if (!identifier || !otp) {
            return res.status(400).send({ message: "identifier and otp are required" });
        }

        const rawIdentifier = String(identifier).trim();
        const isEmailIdentifier = rawIdentifier.includes("@");
        let user = null;
        let tenDigitMobile = null;

        if (isEmailIdentifier) {
            user = await Profile.findOne({ email: rawIdentifier.toLowerCase() });
        } else {
            const normalizedMobile = smsService.normalizeMobileNumber(rawIdentifier);
            if (!normalizedMobile) {
                return res.status(400).send({ message: "Invalid mobile number format" });
            }
            tenDigitMobile = normalizedMobile.slice(-10);
            user = await Profile.findOne({ mobile_number: tenDigitMobile });
        }

        if (!user) {
            return res.status(401).send({ message: "Invalid OTP or identifier" });
        }

        const otpKey = getStaffOtpKey(user._id);
        const verifyResult = await otpService.verifyOtp(otpKey, String(otp).trim(), "login");
        if (!verifyResult.valid) {
            logger.warn({
                userId: user._id,
                reason: verifyResult.reason,
                attemptsLeft: verifyResult.attemptsLeft
            }, "OTP verification failed");
            return res.status(401).send({ message: "Invalid or expired OTP" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, clinic_id: user.clinic_id, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: "1d", issuer: JWT_ISSUER }
        );

        logger.info({
            userId: user._id,
            identifierType: isEmailIdentifier ? "email" : "mobile",
            mobile: tenDigitMobile ? maskMobileNumber(tenDigitMobile) : undefined
        }, "Mobile OTP login successful");
        return res.status(200).send({
            token,
            role: user.role,
            id: user._id,
            clinic_id: user.clinic_id,
            full_name: user.full_name,
            email: user.email,
        });
    } catch (err) {
        logger.error({ err }, "Error verifying mobile OTP");
        return res.status(500).send({ message: "Failed to verify OTP" });
    }
};

/**
 * Patient Login
 */
exports.patientLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
     
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
                code: "MISSING_CREDENTIALS"
            });
        }

        const patient = await Patient.findOne({ email: email.toLowerCase().trim() }).select("+password");
        console.log("=======PATIENT====", patient)
        if (!patient) {
            logger.warn({ email }, 'Patient login failed: patient not found');
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
                code: "INVALID_CREDENTIALS"
            });
        }
        
        if (!patient.password) {
            logger.warn({ patientId: patient._id, email }, 'Patient login failed: no password set');
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
                code: "INVALID_CREDENTIALS"
            });
        }


        const isMatch = await patient.comparePassword(password);
    
        if (!isMatch) {
            logger.warn({ patientId: patient._id, email }, 'Patient login failed: invalid password');
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
                code: "INVALID_CREDENTIALS"
            });
        }

        const token = jwt.sign(
            { id: patient._id, patient_id: patient._id, email: patient.email, full_name: patient.full_name, role: "patient" },
            JWT_SECRET,
            { expiresIn: "7d", issuer: JWT_ISSUER }
        );

        logger.info({ patientId: patient._id, email }, 'Patient login successful');
        res.status(200).json({
            success: true,
            data: {
                token,
                patient_id: patient._id,
                email: patient.email,
                full_name: patient.full_name,
                uhid: patient.uhid
            },
            message: "Login successful"
        });
    } catch (err) {
        logger.error({ err }, 'Patient login error');
        res.status(401).json({
            success: false,
            message: "Invalid email or password",
            code: "INVALID_CREDENTIALS"
        });
    }
};

/**
 * Send OTP for patient login.
 * Accepts identifier as email or mobile number.
 */
exports.sendPatientLoginOtp = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Email or mobile number is required",
                code: "MISSING_IDENTIFIER",
            });
        }

        const rawIdentifier = String(identifier).trim();
        let patient = null;

        if (rawIdentifier.includes("@")) {
            patient = await Patient.findOne({ email: rawIdentifier.toLowerCase() });
        } else {
            const normalizedMobile = smsService.normalizeMobileNumber(rawIdentifier);
            if (normalizedMobile) {
                const tenDigitMobile = normalizedMobile.slice(-10);
                patient = await Patient.findOne({ contact_number: tenDigitMobile });
            }
        }

        if (!patient) {
            return res.status(401).json({
                success: false,
                message: "Account not found",
                code: "PATIENT_NOT_FOUND",
            });
        }

        const otpKey = getPatientOtpKey(patient._id);
        const otp = await otpService.createOtp(otpKey, undefined, "patient_login");
        await sendPatientOtpViaPreferredChannel({
            identifier: rawIdentifier,
            patient,
            otp,
            purpose: "login",
        });

        logger.info({ patientId: patient._id }, "Patient login OTP sent");
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (err) {
        logger.error({ err }, "Error sending patient login OTP");
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to send OTP",
            code: "SEND_OTP_ERROR",
        });
    }
};

/**
 * Verify OTP and login patient.
 */
exports.verifyPatientLoginOtp = async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: "Identifier and OTP are required",
                code: "MISSING_FIELDS",
            });
        }

        const rawIdentifier = String(identifier).trim();
        let patient = null;

        if (rawIdentifier.includes("@")) {
            patient = await Patient.findOne({ email: rawIdentifier.toLowerCase() });
        } else {
            const normalizedMobile = smsService.normalizeMobileNumber(rawIdentifier);
            if (normalizedMobile) {
                const tenDigitMobile = normalizedMobile.slice(-10);
                patient = await Patient.findOne({ contact_number: tenDigitMobile });
            }
        }

        if (!patient) {
            return res.status(401).json({
                success: false,
                message: "Invalid OTP or account details",
                code: "INVALID_OTP_LOGIN",
            });
        }

        const otpKey = getPatientOtpKey(patient._id);
        const verifyResult = await otpService.verifyOtp(otpKey, String(otp).trim(), "patient_login");
        if (!verifyResult.valid) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired OTP",
                code: verifyResult.reason || "INVALID_OTP",
            });
        }

        const token = jwt.sign(
            { id: patient._id, patient_id: patient._id, email: patient.email, full_name: patient.full_name, role: "patient" },
            JWT_SECRET,
            { expiresIn: "7d", issuer: JWT_ISSUER }
        );

        logger.info({ patientId: patient._id }, "Patient OTP login successful");
        return res.status(200).json({
            success: true,
            data: {
                token,
                patient_id: patient._id,
                email: patient.email,
                full_name: patient.full_name,
                uhid: patient.uhid
            },
            message: "Login successful"
        });
    } catch (err) {
        logger.error({ err }, "Error verifying patient login OTP");
        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP",
            code: "VERIFY_OTP_ERROR",
        });
    }
};

/**
 * Patient Register/Signup
 */
exports.patientRegister = async (req, res) => {
    try {
        const { email, password, full_name, contact_number , 
            registration_type = "clinic",
            address,
            state,
            pincode,
            city,
            date_of_birth,
            gender,
        } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: "Email, password, and full name are required",
                code: "MISSING_FIELDS"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if patient already exists
        const existingPatient = await Patient.findOne({ email: normalizedEmail });
        if (existingPatient) {
            logger.warn({ email: normalizedEmail }, 'Patient registration failed: email already exists');
            return res.status(409).json({
                success: false,
                message: "Email already registered",
                code: "EMAIL_EXISTS"
            });
        }

        const patient = new Patient({
            email: normalizedEmail,
            password,
            full_name,
            contact_number,
            registration_type,
            address,
            state,
            pincode,
            city,
            date_of_birth,
            gender,
        });

        await patient.save();
        emailService.sendClinicCredentials(email, full_name, normalizedEmail, password);
        const token = jwt.sign(
            { id: patient._id, patient_id: patient._id, email: patient.email, full_name: patient.full_name, role: "patient" },
            JWT_SECRET,
            { expiresIn: "7d", issuer: JWT_ISSUER }
        );

        logger.info({ patientId: patient._id, email: normalizedEmail }, 'Patient registered successfully');
        // Return payload in the same shape as patientLogin (nest under `data`) for consistency
        res.status(201).json({
            success: true,
            data: {
                token,
                patient_id: patient._id,
                email: patient.email,
                full_name: patient.full_name,
                uhid: patient.uhid
            },
            message: "Patient registered successfully"
        });
    } catch (err) {
        logger.error({ err }, 'Patient registration error');
        
        // Handle duplicate key error
        if (err.code === 11000) {
            const key = err.keyValue ? Object.keys(err.keyValue)[0] : 'email';
            const message = key === 'email' ? 'Email already registered' : key === 'uhid' ? 'UHID generation failed, please try again' : `${key} already exists`;
            return res.status(409).json({
                success: false,
                message,
                code: "DUPLICATE_KEY",
                field: key
            });
        }

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors,
                code: "VALIDATION_ERROR"
            });
        }

        res.status(500).json({
            success: false,
            message: err.message || "Error registering patient",
            code: "REGISTRATION_ERROR"
        });
    }
};

/**
 * Send OTP for patient forgot-password flow.
 * Accepts identifier as email or mobile number.
 */
exports.sendPatientPasswordResetOtp = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Email or mobile number is required",
                code: "MISSING_IDENTIFIER",
            });
        }

        const rawIdentifier = String(identifier).trim();
        let patient = null;

        if (rawIdentifier.includes("@")) {
            patient = await Patient.findOne({ email: rawIdentifier.toLowerCase() });
        } else {
            const normalizedMobile = smsService.normalizeMobileNumber(rawIdentifier);
            if (normalizedMobile) {
                const tenDigitMobile = normalizedMobile.slice(-10);
                patient = await Patient.findOne({ contact_number: tenDigitMobile });
            }
        }

        // Do not reveal account existence
        if (!patient) {
            return res.status(200).json({
                success: true,
                message: "If an account exists, OTP has been sent to the registered mobile number",
            });
        }

        const otpKey = getPatientOtpKey(patient._id);
        const otp = await otpService.createOtp(otpKey, undefined, "patient_password_reset");
        await sendPatientOtpViaPreferredChannel({
            identifier: rawIdentifier,
            patient,
            otp,
            purpose: "password_reset",
        });

        logger.info({ patientId: patient._id }, "Patient password reset OTP sent");

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (err) {
        logger.error({ err }, "Error sending patient password reset OTP");
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to send OTP",
            code: "SEND_OTP_ERROR",
        });
    }
};

/**
 * Reset patient password using OTP.
 * Accepts identifier as email or mobile number.
 */
exports.resetPatientPasswordWithOtp = async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;

        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Identifier, OTP, and new password are required",
                code: "MISSING_FIELDS",
            });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
                code: "WEAK_PASSWORD",
            });
        }

        const rawIdentifier = String(identifier).trim();
        let patient = null;

        if (rawIdentifier.includes("@")) {
            patient = await Patient.findOne({ email: rawIdentifier.toLowerCase() }).select("+password");
        } else {
            const normalizedMobileFromInput = smsService.normalizeMobileNumber(rawIdentifier);
            if (normalizedMobileFromInput) {
                const tenDigitFromInput = normalizedMobileFromInput.slice(-10);
                patient = await Patient.findOne({ contact_number: tenDigitFromInput }).select("+password");
            }
        }

        if (!patient) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP or account details",
                code: "INVALID_RESET_REQUEST",
            });
        }

        const otpKey = getPatientOtpKey(patient._id);
        const verifyResult = await otpService.verifyOtp(otpKey, String(otp).trim(), "patient_password_reset");
        if (!verifyResult.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
                code: verifyResult.reason || "INVALID_OTP",
            });
        }

        patient.password = newPassword;
        await patient.save();

        logger.info({ patientId: patient._id }, "Patient password reset via OTP");
        return res.status(200).json({
            success: true,
            message: "Password reset successful. Please login with your new password",
        });
    } catch (err) {
        logger.error({ err }, "Error resetting patient password with OTP");
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to reset password",
            code: "RESET_PASSWORD_ERROR",
        });
    }
};

//change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword} = req.body;
    logger.debug({ user: req.user }, 'Change password request');
    if (!currentPassword || !newPassword) {
      return res.status(400).send({ message: "Both current and new passwords are required" });
    }

    // Get the logged-in user
    const user = await Profile.findById(req.user.id).select("+password");
    if (!user) return res.status(404).send({ message: "User not found" });

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).send({ message: "Current password is incorrect" });
    }

    // Update to new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.send({ message: "Password changed successfully" });

  } catch (err) {
    logger.error({ err }, 'Error changing password');
    res.status(500).send({ message: err.message });
  }
};

exports.tokenStatus = (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header missing",
      code: "TOKEN_MISSING",
    });
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Bearer token is required",
      code: "TOKEN_MISSING",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null;
    const issuedAt = decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null;

    return res.status(200).json({
      success: true,
      valid: true,
      expiresAt,
      issuedAt,
      user: {
        id: decoded.id,
        role: decoded.role,
        clinic_id: decoded.clinic_id,
        full_name: decoded.full_name,
      },
    });
  } catch (err) {
    logger.warn({ err }, "Token validation failed");

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        valid: false,
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
        expiresAt: err.expiredAt?.toISOString(),
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        valid: false,
        code: "TOKEN_INVALID",
        message: "Token is invalid",
      });
    }

    return res.status(500).json({
      success: false,
      valid: false,
      code: "TOKEN_ERROR",
      message: "Failed to validate token",
    });
  }
};

// forgot password

const { sendEmail } = require("../services/email.service");
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const user = await Profile.findOne({ email: email.toLowerCase().trim() });
    // Don't reveal if email exists or not (security best practice)
    if (!user) {
      logger.warn({ email }, 'Forgot password request for non-existent user');
      return res.status(200).send({ message: "If that email exists in our system, you will receive a password reset link." });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");

    // Set token & expiration (1 hour)
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send token via email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const subject = 'Password Reset Request';
    const text = `You requested a password reset.\n\nYour reset token: ${token}\n\nOr click the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;
    const html = `<p>You requested a password reset.</p><p><b>Your reset token:</b> ${token}</p><p>Or click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;
    try {
      await sendEmail({ to: user.email, subject, text, html });
      logger.info({ email: user.email, tokenGenerated: true }, 'Password reset token sent via email');
      res.status(200).send({ message: "If that email exists in our system, you will receive a password reset link." });
    } catch (err) {
      logger.error({ err, email: user.email }, 'Error sending password reset email');
      res.status(500).send({ message: "Failed to send reset email. Please try again later." });
    }
  } catch (err) {
    logger.error({ err }, 'Error in forgot password');
    res.status(500).send({ message: "An error occurred. Please try again." });
  }
};


// Step 2: Reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    logger.info({ token: token ? 'provided' : 'missing', newPassword: newPassword ? 'provided' : 'missing' }, 'Reset password request received');

    if (!token || !newPassword) {
      return res.status(400).send({ message: "Token and new password are required" });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters long" });
    }

    // Hash the token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    logger.debug({ token, hashedToken }, 'Token hashing for DB lookup');

    // Find user by token and check expiration
    const user = await Profile.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select("+password");
    
    if (!user) {
      logger.warn({ token: hashedToken }, 'Invalid or expired reset token attempted');
      return res.status(400).send({ message: "Invalid or expired token" });
    }
    
    logger.info({ userId: user._id, email: user.email }, 'User found for password reset');

    // Hash the new password directly (same way as register controller)
    logger.debug({ passwordLength: newPassword.length }, 'Starting password hash');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    logger.debug({ hashedLength: hashedPassword.length, startsWithHash: hashedPassword.startsWith('$2') }, 'Password hashed successfully');
    console.log("hashedPassword",  user._id);
    // Update user directly with hashed password
    const updatedUser = await Profile.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      },
      { new: true }
    );

    if (!updatedUser) {
      logger.error({ userId: user._id }, 'Failed to update user with new password');
      return res.status(500).send({ message: "Failed to save password. Please try again." });
    }

    logger.info({ userId: user._id, email: user.email }, 'Password reset successfully and verified');

    res.status(200).send({ message: "Password has been reset successfully. Please log in with your new password." });
  } catch (err) {
    logger.error({ err, message: err.message, stack: err.stack }, 'Error resetting password');
    res.status(500).send({ message: "Failed to reset password. Please try again." });
  }
};
   
