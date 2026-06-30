import AppError from '../utils/AppError.js';

export const requireAnyPermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }

  const userPermissions = req.userPermissions || [];
  const hasAny = permissions.some((p) => userPermissions.includes(p));

  if (!hasAny) {
    return next(new AppError('Insufficient permissions to access dashboard', 403));
  }

  return next();
};

export default requireAnyPermission;
