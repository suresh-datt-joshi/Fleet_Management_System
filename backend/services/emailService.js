import nodemailer from 'nodemailer';
import config from '../config/index.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log(`[Email Dev Mode] To: ${to} | Subject: ${subject}`);
    if (text) console.log(`[Email Dev Mode] Body: ${text}`);
    return { messageId: 'dev-mode', preview: text };
  }

  const info = await mailTransporter.sendMail({
    from: process.env.EMAIL_FROM || 'Fleet Management <noreply@fleetmanagement.com>',
    to,
    subject,
    html,
    text,
  });

  return info;
};

export const sendOTPEmail = async (email, otp, type) => {
  const subject =
    type === 'email_verification'
      ? 'Verify Your Email - Fleet Management System'
      : 'Password Reset OTP - Fleet Management System';

  const message =
    type === 'email_verification'
      ? 'Use the OTP below to verify your email address.'
      : 'Use the OTP below to reset your password.';

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1565C0;">Fleet Management System</h2>
      <p>${message}</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1565C0;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 14px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  const text = `${message}\n\nYour OTP: ${otp}\n\nThis OTP expires in 10 minutes.`;

  return sendEmail({ to: email, subject, html, text });
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = 'Reset Your Password - Fleet Management System';
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1565C0;">Fleet Management System</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #1565C0; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Reset Password</a>
      <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  const text = `Reset your password: ${resetUrl}`;

  return sendEmail({ to: email, subject, html, text });
};

export default { sendOTPEmail, sendPasswordResetEmail };
