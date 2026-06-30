import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import FuelLog from '../models/FuelLog.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Alert from '../models/Alert.js';
import Activity from '../models/Activity.js';
import {
  VEHICLE_STATUS,
  DRIVER_STATUS,
  TRIP_STATUS,
  MAINTENANCE_STATUS,
  MAINTENANCE_TYPE,
  ALERT_TYPES,
  ALERT_SEVERITY,
  ACTIVITY_TYPES,
} from '../constants/enums.js';

dotenv.config();

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const monthsAgoDate = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

const seedDashboard = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingVehicles = await Vehicle.countDocuments();
    if (existingVehicles > 0) {
      console.log('Dashboard data already seeded. Skipping.');
      process.exit(0);
    }

    const admin = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL || 'admin@fleetmanagement.com' });

    const drivers = await Driver.insertMany([
      {
        employeeId: 'DRV-001',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@fleet.com',
        phone: '+1-555-0101',
        licenseNumber: 'DL-2024-001',
        licenseExpiry: new Date('2027-06-15'),
        experienceYears: 8,
        status: DRIVER_STATUS.ON_TRIP,
        performanceScore: 92,
      },
      {
        employeeId: 'DRV-002',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@fleet.com',
        phone: '+1-555-0102',
        licenseNumber: 'DL-2024-002',
        licenseExpiry: new Date('2026-12-20'),
        experienceYears: 5,
        status: DRIVER_STATUS.AVAILABLE,
        performanceScore: 88,
      },
      {
        employeeId: 'DRV-003',
        firstName: 'Robert',
        lastName: 'Chen',
        email: 'robert.chen@fleet.com',
        phone: '+1-555-0103',
        licenseNumber: 'DL-2024-003',
        licenseExpiry: new Date('2028-03-10'),
        experienceYears: 12,
        status: DRIVER_STATUS.AVAILABLE,
        performanceScore: 95,
      },
      {
        employeeId: 'DRV-004',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@fleet.com',
        phone: '+1-555-0104',
        licenseNumber: 'DL-2024-004',
        licenseExpiry: new Date('2027-09-05'),
        experienceYears: 3,
        status: DRIVER_STATUS.OFF_DUTY,
        performanceScore: 78,
      },
      {
        employeeId: 'DRV-005',
        firstName: 'David',
        lastName: 'Martinez',
        email: 'david.martinez@fleet.com',
        phone: '+1-555-0105',
        licenseNumber: 'DL-2024-005',
        licenseExpiry: new Date('2026-08-18'),
        experienceYears: 6,
        status: DRIVER_STATUS.ON_TRIP,
        performanceScore: 85,
      },
    ]);

    const vehicleData = [
      { vehicleNumber: 'FL-1001', model: 'Sprinter', manufacturer: 'Mercedes-Benz', year: 2023, fuelLevel: 72, ignition: true, engineStatus: 'running', speed: 45, lat: 40.7128, lng: -74.006, address: 'New York, NY' },
      { vehicleNumber: 'FL-1002', model: 'Transit', manufacturer: 'Ford', year: 2022, fuelLevel: 35, ignition: true, engineStatus: 'running', speed: 62, lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
      { vehicleNumber: 'FL-1003', model: 'NV3500', manufacturer: 'Nissan', year: 2021, fuelLevel: 88, ignition: false, engineStatus: 'off', speed: 0, lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
      { vehicleNumber: 'FL-1004', model: 'ProMaster', manufacturer: 'Ram', year: 2024, fuelLevel: 15, ignition: true, engineStatus: 'idle', speed: 0, lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
      { vehicleNumber: 'FL-1005', model: 'Express', manufacturer: 'Chevrolet', year: 2020, status: VEHICLE_STATUS.MAINTENANCE, fuelLevel: 50, ignition: false, engineStatus: 'off', speed: 0, lat: 33.4484, lng: -112.074, address: 'Phoenix, AZ' },
      { vehicleNumber: 'FL-1006', model: 'Sprinter', manufacturer: 'Mercedes-Benz', year: 2023, fuelLevel: 60, ignition: true, engineStatus: 'running', speed: 55, lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },
      { vehicleNumber: 'FL-1007', model: 'Transit', manufacturer: 'Ford', year: 2022, fuelLevel: 90, ignition: false, engineStatus: 'off', speed: 0, lat: 32.7767, lng: -96.797, address: 'Dallas, TX' },
      { vehicleNumber: 'FL-1008', model: 'NV3500', manufacturer: 'Nissan', year: 2021, fuelLevel: 42, ignition: true, engineStatus: 'running', speed: 38, lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
    ];

    const vehicles = await Vehicle.insertMany(
      vehicleData.map((v, i) => ({
        vehicleNumber: v.vehicleNumber,
        vin: `VIN${100000 + i}`,
        model: v.model,
        manufacturer: v.manufacturer,
        year: v.year,
        status: v.status || VEHICLE_STATUS.ACTIVE,
        fuelLevel: v.fuelLevel,
        odometer: randomBetween(10000, 150000),
        assignedDriver: drivers[i % drivers.length]._id,
        speed: v.speed,
        ignition: v.ignition,
        engineStatus: v.engineStatus,
        currentLocation: {
          type: 'Point',
          coordinates: [v.lng, v.lat],
          address: v.address,
        },
        documentExpiry: {
          insurance: daysAgo(-randomBetween(30, 365)),
          registration: daysAgo(-randomBetween(60, 400)),
          fitness: daysAgo(randomBetween(5, 60)),
          emission: daysAgo(-randomBetween(90, 300)),
        },
        createdBy: admin?._id,
      }))
    );

    await Driver.updateMany({}, { $set: { assignedVehicle: null } });
    for (let i = 0; i < Math.min(drivers.length, vehicles.length); i += 1) {
      await Driver.findByIdAndUpdate(drivers[i]._id, { assignedVehicle: vehicles[i]._id });
      await Vehicle.findByIdAndUpdate(vehicles[i]._id, { assignedDriver: drivers[i]._id });
    }

    const trips = [];
    for (let m = 5; m >= 0; m -= 1) {
      const monthDate = monthsAgoDate(m);
      const tripsInMonth = randomBetween(8, 20);
      for (let t = 0; t < tripsInMonth; t += 1) {
        const driver = drivers[randomBetween(0, drivers.length - 1)];
        const vehicle = vehicles[randomBetween(0, vehicles.length - 1)];
        const scheduledAt = new Date(monthDate);
        scheduledAt.setDate(randomBetween(1, 28));
        const isCompleted = Math.random() > 0.25;
        const distance = randomBetween(20, 500);
        const revenue = randomBetween(200, 3000);
        const expenses = randomBetween(50, 800);

        trips.push({
          tripNumber: `TRP-${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(trips.length + 1).padStart(4, '0')}`,
          status: isCompleted ? TRIP_STATUS.COMPLETED : TRIP_STATUS.SCHEDULED,
          driver: driver._id,
          vehicle: vehicle._id,
          origin: { address: 'Warehouse A', lat: 40.7, lng: -74.0 },
          destination: { address: 'Distribution Center B', lat: 40.8, lng: -73.9 },
          scheduledAt,
          startedAt: isCompleted ? scheduledAt : null,
          completedAt: isCompleted ? new Date(scheduledAt.getTime() + randomBetween(1, 8) * 3600000) : null,
          distance,
          fuelUsed: Math.round(distance * 0.12 * 100) / 100,
          revenue,
          expenses,
          createdBy: admin?._id,
        });
      }
    }

    const todayTrips = randomBetween(3, 8);
    for (let i = 0; i < todayTrips; i += 1) {
      trips.push({
        tripNumber: `TRP-TODAY-${String(i + 1).padStart(4, '0')}`,
        status: i < 2 ? TRIP_STATUS.IN_PROGRESS : TRIP_STATUS.SCHEDULED,
        driver: drivers[i % drivers.length]._id,
        vehicle: vehicles[i % vehicles.length]._id,
        origin: { address: 'Depot Central', lat: 40.71, lng: -74.01 },
        destination: { address: 'Client Site', lat: 40.75, lng: -73.98 },
        scheduledAt: new Date(),
        startedAt: i < 2 ? new Date() : null,
        distance: randomBetween(10, 100),
        revenue: randomBetween(150, 1200),
        expenses: randomBetween(30, 300),
        createdBy: admin?._id,
      });
    }

    await Trip.insertMany(trips);

    const fuelLogs = [];
    for (let m = 5; m >= 0; m -= 1) {
      const monthDate = monthsAgoDate(m);
      for (let f = 0; f < randomBetween(10, 25); f += 1) {
        const vehicle = vehicles[randomBetween(0, vehicles.length - 1)];
        const quantity = randomBetween(20, 80);
        const pricePerUnit = randomBetween(3, 5);
        fuelLogs.push({
          vehicle: vehicle._id,
          driver: drivers[randomBetween(0, drivers.length - 1)]._id,
          quantity,
          cost: quantity * pricePerUnit,
          pricePerUnit,
          odometer: randomBetween(10000, 150000),
          mileage: randomBetween(8, 15),
          fuelStation: `Station ${randomBetween(1, 10)}`,
          loggedAt: new Date(monthDate.getTime() + randomBetween(1, 28) * 86400000),
          createdBy: admin?._id,
        });
      }
    }
    await FuelLog.insertMany(fuelLogs);

    await MaintenanceRecord.insertMany([
      {
        workOrderNumber: 'WO-2026-001',
        vehicle: vehicles[4]._id,
        type: MAINTENANCE_TYPE.REPAIR,
        status: MAINTENANCE_STATUS.IN_PROGRESS,
        title: 'Engine oil change & filter replacement',
        scheduledDate: daysAgo(2),
        cost: 450,
        createdBy: admin?._id,
      },
      {
        workOrderNumber: 'WO-2026-002',
        vehicle: vehicles[1]._id,
        type: MAINTENANCE_TYPE.PREVENTIVE,
        status: MAINTENANCE_STATUS.SCHEDULED,
        title: 'Brake pad inspection',
        scheduledDate: daysAgo(-3),
        cost: 200,
        createdBy: admin?._id,
      },
      {
        workOrderNumber: 'WO-2026-003',
        vehicle: vehicles[3]._id,
        type: MAINTENANCE_TYPE.INSPECTION,
        status: MAINTENANCE_STATUS.OVERDUE,
        title: 'Annual safety inspection',
        scheduledDate: daysAgo(5),
        cost: 150,
        createdBy: admin?._id,
      },
      {
        workOrderNumber: 'WO-2026-004',
        vehicle: vehicles[6]._id,
        type: MAINTENANCE_TYPE.PREVENTIVE,
        status: MAINTENANCE_STATUS.SCHEDULED,
        title: 'Tire rotation',
        scheduledDate: daysAgo(-5),
        cost: 120,
        createdBy: admin?._id,
      },
    ]);

    await Alert.insertMany([
      {
        type: ALERT_TYPES.LOW_FUEL,
        severity: ALERT_SEVERITY.HIGH,
        title: 'Low Fuel Alert',
        message: 'Vehicle FL-1004 fuel level at 15%',
        vehicle: vehicles[3]._id,
        driver: drivers[3]._id,
      },
      {
        type: ALERT_TYPES.OVERSPEED,
        severity: ALERT_SEVERITY.MEDIUM,
        title: 'Overspeed Detected',
        message: 'Vehicle FL-1002 exceeded 60 mph speed limit',
        vehicle: vehicles[1]._id,
        driver: drivers[1]._id,
      },
      {
        type: ALERT_TYPES.MAINTENANCE_DUE,
        severity: ALERT_SEVERITY.HIGH,
        title: 'Maintenance Overdue',
        message: 'Annual safety inspection overdue for FL-1004',
        vehicle: vehicles[3]._id,
      },
      {
        type: ALERT_TYPES.INSURANCE_EXPIRY,
        severity: ALERT_SEVERITY.CRITICAL,
        title: 'Insurance Expiring Soon',
        message: 'Insurance for FL-1005 expires in 30 days',
        vehicle: vehicles[4]._id,
      },
      {
        type: ALERT_TYPES.DOCUMENT_EXPIRY,
        severity: ALERT_SEVERITY.MEDIUM,
        title: 'Fitness Certificate Expiring',
        message: 'Fitness certificate for FL-1003 expires soon',
        vehicle: vehicles[2]._id,
      },
    ]);

    await Activity.insertMany([
      {
        type: ACTIVITY_TYPES.TRIP_COMPLETED,
        title: 'Trip completed',
        description: 'Trip TRP-TODAY-0001 delivered successfully',
        entityType: 'trip',
        user: admin?._id,
      },
      {
        type: ACTIVITY_TYPES.VEHICLE_ADDED,
        title: 'New vehicle added',
        description: 'Vehicle FL-1008 added to fleet',
        entityType: 'vehicle',
        entityId: vehicles[7]._id,
        user: admin?._id,
      },
      {
        type: ACTIVITY_TYPES.DRIVER_ASSIGNED,
        title: 'Driver assigned',
        description: 'James Wilson assigned to FL-1001',
        entityType: 'driver',
        entityId: drivers[0]._id,
        user: admin?._id,
      },
      {
        type: ACTIVITY_TYPES.FUEL_LOGGED,
        title: 'Fuel logged',
        description: '45L diesel refueled at Station 3 for FL-1002',
        entityType: 'fuel',
        user: admin?._id,
      },
      {
        type: ACTIVITY_TYPES.MAINTENANCE_SCHEDULED,
        title: 'Maintenance scheduled',
        description: 'Brake pad inspection scheduled for FL-1002',
        entityType: 'maintenance',
        user: admin?._id,
      },
      {
        type: ACTIVITY_TYPES.ALERT_TRIGGERED,
        title: 'Low fuel alert',
        description: 'Alert triggered for FL-1004 — fuel at 15%',
        entityType: 'alert',
        user: admin?._id,
      },
      {
        type: ACTIVITY_TYPES.TRIP_CREATED,
        title: 'New trip created',
        description: 'Trip scheduled from Depot Central to Client Site',
        entityType: 'trip',
        user: admin?._id,
      },
    ]);

    console.log('Dashboard seed completed successfully');
    console.log(`  Vehicles: ${vehicles.length}`);
    console.log(`  Drivers: ${drivers.length}`);
    console.log(`  Trips: ${trips.length}`);
    console.log(`  Fuel Logs: ${fuelLogs.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Dashboard seed failed:', error.message);
    process.exit(1);
  }
};

seedDashboard();
