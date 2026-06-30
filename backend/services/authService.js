import User from '../models/User.js';
import Driver from '../models/Driver.js';
import AppError from '../utils/AppError.js';
import { generateOTP, getOTPExpiry } from '../utils/generateOTP.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { sendOTPEmail } from '../services/emailService.js';
import { ROLE_PERMISSIONS, USER_ROLES } from '../constants/roles.js';
import config from '../config/index.js';

const MAX_REFRESH_TOKENS = 5;
const MAX_OTP_ATTEMPTS = 5;

const sanitizeUser = (user) => {
  const userObj = user.toJSON ? user.toJSON() : user;
  return {
    ...userObj,
    permissions: ROLE_PERMISSIONS[userObj.role] || [],
  };
};

const createTokens = (user) => {
  const payload = { id: user._id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user._id });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (user, refreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.refreshTokens.push({ token: refreshToken, expiresAt });

  if (user.refreshTokens.length > MAX_REFRESH_TOKENS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS);
  }

  await user.save({ validateBeforeSave: false });
};

export const registerUser = async ({ firstName, lastName, email, password, phone, role }) => {
  const allowedRoles = [
    USER_ROLES.DISPATCHER,
    USER_ROLES.DRIVER,
    USER_ROLES.MECHANIC,
    USER_ROLES.FLEET_MANAGER,
  ];

  if (role && !allowedRoles.includes(role)) {
    throw new AppError('Invalid role for registration', 400);
  }

  const existingUser = await User.findOne({ email, isDeleted: false });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const otp = generateOTP();
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role: role || undefined,
    otp: {
      code: otp,
      type: 'email_verification',
      expiresAt: getOTPExpiry(10),
      attempts: 0,
    },
  });

  await sendOTPEmail(email, otp, 'email_verification');

  return {
    user: sanitizeUser(user),
    message: 'Registration successful. Please verify your email with the OTP sent.',
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email, isDeleted: false }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact administrator.', 403);
  }

  if (!user.isEmailVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  const { accessToken, refreshToken } = createTokens(user);
  await storeRefreshToken(user, refreshToken);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || user.isDeleted || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const storedToken = user.refreshTokens.find((t) => t.token === refreshToken);
  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token expired or revoked', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = createTokens(user);

  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
  await storeRefreshToken(user, newRefreshToken);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (userId, refreshToken) => {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  if (refreshToken) {
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
  } else {
    user.refreshTokens = [];
  }

  await user.save({ validateBeforeSave: false });
};

export const verifyEmailOTP = async ({ email, otp }) => {
  const user = await User.findOne({ email, isDeleted: false }).select('+otp');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isEmailVerified) {
    return { user: sanitizeUser(user), message: 'Email already verified' };
  }

  if (!user.otp || user.otp.type !== 'email_verification') {
    throw new AppError('No verification OTP found. Request a new one.', 400);
  }

  if (user.otp.expiresAt < new Date()) {
    throw new AppError('OTP has expired. Request a new one.', 400);
  }

  if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many failed attempts. Request a new OTP.', 429);
  }

  if (user.otp.code !== otp) {
    user.otp.attempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Invalid OTP', 400);
  }

  user.isEmailVerified = true;
  user.otp = null;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = createTokens(user);
  await storeRefreshToken(user, refreshToken);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    message: 'Email verified successfully',
  };
};

export const resendVerificationOTP = async (email) => {
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email already verified', 400);
  }

  const otp = generateOTP();
  user.otp = {
    code: otp,
    type: 'email_verification',
    expiresAt: getOTPExpiry(10),
    attempts: 0,
  };
  await user.save({ validateBeforeSave: false });
  await sendOTPEmail(email, otp, 'email_verification');

  return { message: 'Verification OTP sent successfully' };
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    return { message: 'If the email exists, a password reset OTP has been sent' };
  }

  const otp = generateOTP();
  user.otp = {
    code: otp,
    type: 'password_reset',
    expiresAt: getOTPExpiry(10),
    attempts: 0,
  };
  await user.save({ validateBeforeSave: false });
  await sendOTPEmail(email, otp, 'password_reset');

  return { message: 'If the email exists, a password reset OTP has been sent' };
};

export const resetPassword = async ({ email, otp, password }) => {
  const user = await User.findOne({ email, isDeleted: false }).select('+password +otp +refreshTokens');

  if (!user) {
    throw new AppError('Invalid reset request', 400);
  }

  if (!user.otp || user.otp.type !== 'password_reset') {
    throw new AppError('No password reset OTP found. Request a new one.', 400);
  }

  if (user.otp.expiresAt < new Date()) {
    throw new AppError('OTP has expired. Request a new one.', 400);
  }

  if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many failed attempts. Request a new OTP.', 429);
  }

  if (user.otp.code !== otp) {
    user.otp.attempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Invalid OTP', 400);
  }

  user.password = password;
  user.otp = null;
  user.refreshTokens = [];
  await user.save();

  const { accessToken, refreshToken } = createTokens(user);
  await storeRefreshToken(user, refreshToken);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    message: 'Password reset successful',
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const profile = sanitizeUser(user);

  const driver = await Driver.findOne({
    isDeleted: false,
    $or: [{ user: userId }, { email: user.email }],
  })
    .populate('assignedVehicle', 'vehicleNumber model manufacturer status')
    .lean();

  if (driver) {
    profile.linkedDriver = {
      id: driver._id,
      employeeId: driver.employeeId,
      name: `${driver.firstName} ${driver.lastName}`,
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      experienceYears: driver.experienceYears,
      performanceScore: driver.performanceScore,
      assignedVehicle: driver.assignedVehicle
        ? {
            id: driver.assignedVehicle._id,
            vehicleNumber: driver.assignedVehicle.vehicleNumber,
            model: driver.assignedVehicle.model,
            manufacturer: driver.assignedVehicle.manufacturer,
            status: driver.assignedVehicle.status,
          }
        : null,
    };
  }

  return profile;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password +refreshTokens');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  const { accessToken, refreshToken } = createTokens(user);
  await storeRefreshToken(user, refreshToken);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    message: 'Password changed successfully',
  };
};

export default {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmailOTP,
  resendVerificationOTP,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  changePassword,
};
