import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { uploadDriverFile } from '../middleware/uploadDriver.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as mechanicController from '../controllers/mechanicController.js';
import {
  createMechanicValidator,
  updateMechanicValidator,
  mechanicIdValidator,
  listMechanicsValidator,
  documentIdValidator,
} from '../validators/mechanicValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_MECHANICS), mechanicController.getMechanicStats);
router.get('/export', requirePermission(PERMISSIONS.VIEW_MECHANICS), listMechanicsValidator, validate, mechanicController.exportCSV);
router.get('/', requirePermission(PERMISSIONS.VIEW_MECHANICS), listMechanicsValidator, validate, mechanicController.getMechanics);
router.get('/:id/history', requirePermission(PERMISSIONS.VIEW_MECHANICS), mechanicIdValidator, validate, mechanicController.getHistory);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_MECHANICS), mechanicIdValidator, validate, mechanicController.getMechanic);

router.post('/', requirePermission(PERMISSIONS.CREATE_MECHANICS), createMechanicValidator, validate, mechanicController.createMechanic);
router.patch('/:id', requirePermission(PERMISSIONS.UPDATE_MECHANICS), updateMechanicValidator, validate, mechanicController.updateMechanic);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_MECHANICS), mechanicIdValidator, validate, mechanicController.deleteMechanic);

router.post(
  '/:id/avatar',
  requirePermission(PERMISSIONS.UPDATE_MECHANICS),
  mechanicIdValidator,
  validate,
  upload.single('avatar'),
  mechanicController.uploadAvatar
);

router.post(
  '/:id/documents',
  requirePermission(PERMISSIONS.UPDATE_MECHANICS),
  mechanicIdValidator,
  validate,
  uploadDriverFile.single('file'),
  mechanicController.uploadDocument
);

router.delete(
  '/:id/documents/:documentId',
  requirePermission(PERMISSIONS.UPDATE_MECHANICS),
  documentIdValidator,
  validate,
  mechanicController.deleteDocument
);

export default router;
