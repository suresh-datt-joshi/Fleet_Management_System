import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as adminController from '../controllers/adminController.js';
import {
  createUserValidator,
  updateUserValidator,
  resetPasswordValidator,
  userIdValidator,
  listUsersValidator,
  updateSettingsValidator,
} from '../validators/adminValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_ADMIN_PANEL), adminController.getAdminStats);
router.get('/roles', requirePermission(PERMISSIONS.VIEW_ADMIN_PANEL), adminController.getRoles);
router.get('/permissions', requirePermission(PERMISSIONS.MANAGE_ROLES), adminController.getPermissions);

router.get('/settings', requirePermission(PERMISSIONS.MANAGE_SETTINGS), adminController.getSettings);
router.patch('/settings', requirePermission(PERMISSIONS.MANAGE_SETTINGS), updateSettingsValidator, validate, adminController.updateSettings);

router.get('/users', requirePermission(PERMISSIONS.MANAGE_USERS), listUsersValidator, validate, adminController.getUsers);
router.post('/users', requirePermission(PERMISSIONS.MANAGE_USERS), createUserValidator, validate, adminController.createUser);
router.get('/users/:id', requirePermission(PERMISSIONS.MANAGE_USERS), userIdValidator, validate, adminController.getUser);
router.patch('/users/:id', requirePermission(PERMISSIONS.MANAGE_USERS), updateUserValidator, validate, adminController.updateUser);
router.delete('/users/:id', requirePermission(PERMISSIONS.MANAGE_USERS), userIdValidator, validate, adminController.deleteUser);
router.post('/users/:id/reset-password', requirePermission(PERMISSIONS.MANAGE_USERS), resetPasswordValidator, validate, adminController.resetUserPassword);

export default router;
