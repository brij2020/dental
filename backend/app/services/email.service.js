require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * General email sending function
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @param {string} [html] - Email body (HTML, optional)
 */
async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  };
  return transporter.sendMail(mailOptions);
}

/**
 * Send provisional login credentials to a clinic
 */
async function sendClinicCredentials(to, clinicName, username, password) {
  return sendEmail({
    to,
    subject: `Provisional Login Credentials for ${clinicName}`,
    text: `Dear ${clinicName},\n\nYour provisional login credentials are:\nUsername: ${username}\nPassword: ${password}\n\nPlease change your password after first login.`,
  });
}

module.exports = { sendEmail, sendClinicCredentials };
