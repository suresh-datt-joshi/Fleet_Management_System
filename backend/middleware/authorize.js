import AppError from '../utils/AppError.js';

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  return next();
};

export const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }

  const userPermissions = req.userPermissions || [];
  const hasPermission = permissions.every((p) => userPermissions.includes(p));

  if (!hasPermission) {
    return next(new AppError('Insufficient permissions', 403));
  }

  return next();
};

export default authorize;
