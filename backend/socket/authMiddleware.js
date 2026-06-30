import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { ROLE_PERMISSIONS } from '../constants/roles.js';

export const socketAuthMiddleware = (socket, next) => {
  const token =
    socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    socket.permissions = ROLE_PERMISSIONS[decoded.role] || [];
    return next();
  } catch {
    return next(new Error('Invalid token'));
  }
};

export const socketHasPermission = (socket, permission) =>
  (socket.permissions || []).includes(permission);

export default { socketAuthMiddleware, socketHasPermission };
