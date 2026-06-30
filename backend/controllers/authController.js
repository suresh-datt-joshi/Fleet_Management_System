import catchAsync from '../utils/catchAsync.js';
import config from '../config/index.js';
import { getRefreshTokenCookieOptions } from '../utils/jwt.js';
import * as authService from '../services/authService.js';

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};

export const register = catchAsync(async (req, res) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: result.message,
    data: { user: result.user },
  });
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const result = await authService.refreshAccessToken(token);
  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const logout = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  await authService.logoutUser(req.user._id, token);
  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const verifyOtp = catchAsync(async (req, res) => {
  const result = await authService.verifyEmailOTP(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const resendOtp = catchAsync(async (req, res) => {
  const result = await authService.resendVerificationOTP(req.body.email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});
