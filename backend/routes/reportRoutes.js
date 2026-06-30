import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as reportController from '../controllers/reportController.js';
import {
  listReportsValidator,
  reportQueryValidator,
  exportReportValidator,
  previewReportValidator,
} from '../validators/reportValidator.js';

const router = Router();

router.use(protect);

router.get('/catalog', requirePermission(PERMISSIONS.VIEW_REPORTS), reportController.getReportCatalog);
router.get('/stats', requirePermission(PERMISSIONS.VIEW_REPORTS), reportController.getReportStats);
router.get('/history', requirePermission(PERMISSIONS.VIEW_REPORTS), listReportsValidator, validate, reportController.getReportHistory);
router.get('/export', requirePermission(PERMISSIONS.EXPORT_REPORTS), exportReportValidator, validate, reportController.exportReport);

router.get('/summary', requirePermission(PERMISSIONS.VIEW_REPORTS), reportQueryValidator, validate, reportController.getFleetSummary);
router.get('/financial', requirePermission(PERMISSIONS.VIEW_REPORTS), reportQueryValidator, validate, reportController.getFinancialReport);
router.get('/operational', requirePermission(PERMISSIONS.VIEW_REPORTS), reportQueryValidator, validate, reportController.getOperationalReport);

router.get('/preview/:type', requirePermission(PERMISSIONS.VIEW_REPORTS), previewReportValidator, validate, reportController.getReportPreview);

export default router;
