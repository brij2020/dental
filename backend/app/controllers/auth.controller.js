const db = require("../models");
const Profile = db.profiles;
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



        const user = await Profile.findOne({ email }).select("+password");
        console.log("=====user", user);
        if (!user) return res.status(404).send({ message: "User not found" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).send({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role, clinic_id: user.clinic_id, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.send({
            token,
            role: user.role,
            id: user._id,
            clinic_id: user.clinic_id,
            full_name: user.full_name
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).send({ message: "Email is required" });

  const user = await Profile.findOne({ email });
  if (!user) return res.status(404).send({ message: "User not found" });

  // Generate token
  const token = crypto.randomBytes(20).toString("hex");

  // Set token & expiration (1 hour)
  user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  await user.save();

  // Send token via email (simulate)
  logger.info({ email, token }, 'Password reset token generated');

  res.send({ message: "Password reset token sent to your email" });
};


// Step 2: Reset password using token
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).send({ message: "Token and new password are required" });
  }

  // Hash the token to compare with DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user by token and check expiration
  const user = await Profile.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  }).select("+password");

  if (!user) {
    return res.status(400).send({ message: "Invalid or expired token" });
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.send({ message: "Password has been reset successfully" });
};