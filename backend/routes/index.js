import { Router } from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import driverRoutes from './driverRoutes.js';
import mechanicRoutes from './mechanicRoutes.js';
import gpsRoutes from './gpsRoutes.js';
import routeRoutes from './routeRoutes.js';
import fuelRoutes from './fuelRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import documentRoutes from './documentRoutes.js';
import tripRoutes from './tripRoutes.js';
import alertRoutes from './alertRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes from './reportRoutes.js';
import adminRoutes from './adminRoutes.js';
import mapsRoutes from './mapsRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/mechanics', mechanicRoutes);
router.use('/gps', gpsRoutes);
router.use('/routes', routeRoutes);
router.use('/fuel', fuelRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/documents', documentRoutes);
router.use('/trips', tripRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/maps', mapsRoutes);

export default router;
