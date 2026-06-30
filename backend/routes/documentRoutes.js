import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { documentUpload } from '../middleware/documentUpload.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as documentController from '../controllers/documentController.js';
import {
  createDocumentValidator,
  updateDocumentValidator,
  documentIdValidator,
  listDocumentsValidator,
} from '../validators/documentValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), documentController.getDocumentStats);
router.get('/expiring', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), documentController.getExpiringDocuments);
router.get('/analytics', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), documentController.getDocumentAnalytics);
router.get('/meta/vehicles', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), documentController.getMetaVehicles);
router.get('/meta/drivers', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), documentController.getMetaDrivers);
router.get('/export', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), listDocumentsValidator, validate, documentController.exportDocuments);
router.get('/', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), listDocumentsValidator, validate, documentController.getDocuments);

router.get('/:id/download', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), documentIdValidator, validate, documentController.downloadDocument);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), documentIdValidator, validate, documentController.getDocument);

router.post(
  '/',
  requirePermission(PERMISSIONS.MANAGE_DOCUMENTS),
  documentUpload.single('file'),
  createDocumentValidator,
  validate,
  documentController.createDocument
);
router.patch(
  '/:id/file',
  requirePermission(PERMISSIONS.MANAGE_DOCUMENTS),
  documentIdValidator,
  validate,
  documentUpload.single('file'),
  documentController.replaceDocumentFile
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.MANAGE_DOCUMENTS),
  updateDocumentValidator,
  validate,
  documentController.updateDocument
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.MANAGE_DOCUMENTS),
  documentIdValidator,
  validate,
  documentController.deleteDocument
);

export default router;
