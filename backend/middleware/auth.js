import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ROLE_PERMISSIONS } from '../constants/roles.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please refresh your token.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  const user = await User.findOne({ _id: decoded.id, isDeleted: false });
  if (!user) {
    return next(new AppError('User no longer exists', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account deactivated', 403));
  }

  req.user = user;
  req.userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return next();
});

export const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findOne({ _id: decoded.id, isDeleted: false });
    if (user && user.isActive) {
      req.user = user;
      req.userPermissions = ROLE_PERMISSIONS[user.role] || [];
    }
  } catch {
    // Optional auth — ignore invalid tokens
  }

  return next();
});

export default protect;
