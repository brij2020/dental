const { verifyToken, allowRoles } = require("../middleware/auth.middleware");
const { throttle } = require("../middleware/throttle.middleware");

module.exports = app => {
  const auth = require("../controllers/auth.controller");
  const router = require("express").Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a doctor or receptionist
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - full_name
 *               - password
 *               - role
 *               - clinic_id
 *               - mobile_number
 *             properties:
 *               email:
 *                 type: string
 *                 example: dr.rahul@example.com
 *               full_name:
 *                 type: string
 *                 example: Dr Rahul Sharma
 *               password:
 *                 type: string
 *                 example: Doctor@123
 *               role:
 *                 type: string
 *                 enum: [doctor, receptionist]
 *                 example: doctor
 *               clinic_id:
 *                 type: string
 *                 example: 66b8f9d2c3a91e8f4b1a1234
 *               mobile_number:
 *                 type: string
 *                 example: 9876501234
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or duplicate field
 */
  router.post("/register", throttle({ windowMs: 60 * 1000, max: 6, scope: "auth-register" }), auth.register);
  /**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: dr.rahul@example.com
 *               password:
 *                 type: string
 *                 example: Doctor@123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */
  router.post("/login", throttle({ windowMs: 60 * 1000, max: 5, scope: "auth-login" }), auth.login);
  router.post("/send-mobile-otp", throttle({ windowMs: 60 * 1000, max: 4, scope: "auth-otp" }), auth.sendMobileOtp);
  router.post("/verify-mobile-otp", throttle({ windowMs: 60 * 1000, max: 5, scope: "auth-otp-verify" }), auth.verifyMobileOtp);
  /**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Doctor@123
 *               newPassword:
 *                 type: string
 *                 example: Doctor@456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password incorrect
 */
  router.put("/change-password", verifyToken, throttle({ windowMs: 60 * 1000, max: 3, scope: "auth-change-password" }), auth.changePassword);
  /**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: dr.rahul@example.com
 *     responses:
 *       200:
 *         description: Token sent to user email (console for testing)
 *       404:
 *         description: User not found
 */
  router.post("/forgot-password", throttle({ windowMs: 60 * 60 * 1000, max: 3, scope: "auth-forgot-password" }), auth.forgotPassword);
  
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: a1b2c3d4e5f6
 *               newPassword:
 *                 type: string
 *                 example: Doctor@789
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
  router.post("/reset-password", throttle({ windowMs: 60 * 60 * 1000, max: 3, scope: "auth-reset-password" }), auth.resetPassword);
  router.get("/token-status", throttle({ windowMs: 60 * 1000, max: 10, scope: "auth-token-status" }), auth.tokenStatus);

  /**
   * @swagger
   * /api/auth/patient-login:
   *   post:
   *     summary: Patient login
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: patient@example.com
   *               password:
   *                 type: string
   *                 example: Password@123
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  router.post("/patient-login", throttle({ windowMs: 60 * 1000, max: 5, scope: "auth-patient-login" }), auth.patientLogin);
  router.post("/patient-login/send-otp", throttle({ windowMs: 60 * 1000, max: 4, scope: "auth-patient-otp" }), auth.sendPatientLoginOtp);
  router.post("/patient-login/verify-otp", throttle({ windowMs: 60 * 1000, max: 5, scope: "auth-patient-otp-verify" }), auth.verifyPatientLoginOtp);

  /**
   * @swagger
   * /api/auth/patient-register:
   *   post:
   *     summary: Patient registration/signup
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - full_name
   *             properties:
   *               email:
   *                 type: string
   *                 example: patient@example.com
   *               password:
   *                 type: string
   *                 example: Password@123
   *               full_name:
   *                 type: string
   *                 example: John Doe
   *               contact_number:
   *                 type: string
   *                 example: "9876543210"
   *     responses:
   *       201:
   *         description: Registration successful
   *       409:
   *         description: Email already registered
   */
  router.post("/patient-register", auth.patientRegister);
  router.post("/patient-forgot-password/send-otp", throttle({ windowMs: 60 * 60 * 1000, max: 3, scope: "auth-patient-forgot" }), auth.sendPatientPasswordResetOtp);
  router.post("/patient-forgot-password/reset-with-otp", throttle({ windowMs: 60 * 60 * 1000, max: 3, scope: "auth-patient-reset" }), auth.resetPatientPasswordWithOtp);

  app.use("/api/auth", router);

};
