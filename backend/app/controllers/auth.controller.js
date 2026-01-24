const db = require("../models");
const Profile = db.profiles;
const Patient = db.patients;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto")
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const { logger } = require("../config/logger");

/**
 * Register (Doctor / Admin)
 */
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, clinic_id, role } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).send({ message: "Required fields missing" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new Profile({
            email,
            password: hashedPassword,
            full_name,
            clinic_id,
            role: role || "doctor"
        });

        await user.save();

        res.status(201).send({ message: "User registered successfully" });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).send({ message: "Email already exists" });
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
        if (!user) {
            logger.warn({ email }, 'Login failed: user not found');
            return res.status(401).send({ message: "Invalid email or password" });
        }

        if (!user.password) {
            logger.warn({ userId: user._id, email }, 'Login failed: no password set');
            return res.status(401).send({ message: "Invalid email or password" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn({ userId: user._id, email }, 'Login failed: invalid password');
            return res.status(401).send({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, clinic_id: user.clinic_id, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: "1d" }
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
            { expiresIn: "7d" }
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
 * Patient Register/Signup
 */
exports.patientRegister = async (req, res) => {
    try {
        const { email, password, full_name, contact_number } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: "Email, password, and full name are required",
                code: "MISSING_FIELDS"
            });
        }

        
        // Check if patient already exists
        const existingPatient = await Patient.findOne({ email: email.toLowerCase().trim() });
        if (existingPatient) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
                code: "EMAIL_EXISTS"
            });
        }

        const patient = new Patient({
            email: email.toLowerCase().trim(),
            password,
            full_name: full_name.trim(),
            contact_number: contact_number || null
        });

        await patient.save();

        const token = jwt.sign(
            { id: patient._id, patient_id: patient._id, email: patient.email, full_name: patient.full_name, role: "patient" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        logger.info({ patientId: patient._id, email }, 'Patient registered successfully');
        res.status(201).json({
            success: true,
            data: {
                token,
                patient_id: patient._id,
                email: patient.email,
                full_name: patient.full_name,
                uhid: patient.uhid
            },
            message: "Registration successful"
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
                code: "DUPLICATE_EMAIL"
            });
        }
        logger.error({ err }, 'Patient registration error');
        res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            code: "INTERNAL_SERVER_ERROR"
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
   