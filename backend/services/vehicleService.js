import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import VehicleHistory from '../models/VehicleHistory.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import { VEHICLE_STATUS, VEHICLE_HISTORY_ACTIONS, ACTIVITY_TYPES } from '../constants/enums.js';
import { notifyDriverEvent } from './alertService.js';

const populateOptions = {
  path: 'assignedDriver',
  select: 'firstName lastName employeeId phone status',
};

const logHistory = async (vehicleId, action, description, userId, changes = null) => {
  await VehicleHistory.create({
    vehicle: vehicleId,
    action,
    description,
    performedBy: userId,
    changes,
  });
};

const logActivity = async (type, title, description, userId, entityId) => {
  await Activity.create({
    type,
    title,
    description,
    entityType: 'vehicle',
    entityId,
    user: userId,
  });
};

const buildFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.manufacturer) {
    filter.manufacturer = new RegExp(query.manufacturer, 'i');
  }

  if (query.fuelType) {
    filter.fuelType = query.fuelType;
  }

  if (query.assigned === 'true') {
    filter.assignedDriver = { $ne: null };
  } else if (query.assigned === 'false') {
    filter.assignedDriver = null;
  }

  if (query.search) {
    filter.$or = [
      { vehicleNumber: new RegExp(query.search, 'i') },
      { model: new RegExp(query.search, 'i') },
      { manufacturer: new RegExp(query.search, 'i') },
      { vin: new RegExp(query.search, 'i') },
      { registrationNumber: new RegExp(query.search, 'i') },
    ];
  }

  return filter;
};

export const getVehicles = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).populate(populateOptions).sort(sort).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(filter),
  ]);

  return {
    vehicles,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getVehicleById = async (id) => {
  const vehicle = await Vehicle.findOne({ _id: id, isDeleted: false }).populate(populateOptions).lean();
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  return vehicle;
};

export const createVehicle = async (data, userId) => {
  const existing = await Vehicle.findOne({ vehicleNumber: data.vehicleNumber.toUpperCase(), isDeleted: false });
  if (existing) throw new AppError('Vehicle number already exists', 409);

  const vehicle = await Vehicle.create({
    ...data,
    vehicleNumber: data.vehicleNumber.toUpperCase(),
    createdBy: userId,
    updatedBy: userId,
  });

  await logHistory(
    vehicle._id,
    VEHICLE_HISTORY_ACTIONS.CREATED,
    `Vehicle ${vehicle.vehicleNumber} created`,
    userId
  );
  await logActivity(
    ACTIVITY_TYPES.VEHICLE_ADDED,
    'Vehicle added',
    `${vehicle.vehicleNumber} — ${vehicle.manufacturer} ${vehicle.model}`,
    userId,
    vehicle._id
  );

  return Vehicle.findById(vehicle._id).populate(populateOptions).lean();
};

export const updateVehicle = async (id, data, userId) => {
  const vehicle = await Vehicle.findOne({ _id: id, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (data.vehicleNumber && data.vehicleNumber.toUpperCase() !== vehicle.vehicleNumber) {
    const dup = await Vehicle.findOne({
      vehicleNumber: data.vehicleNumber.toUpperCase(),
      isDeleted: false,
      _id: { $ne: id },
    });
    if (dup) throw new AppError('Vehicle number already exists', 409);
    data.vehicleNumber = data.vehicleNumber.toUpperCase();
  }

  const previousStatus = vehicle.status;
  Object.assign(vehicle, data, { updatedBy: userId });
  await vehicle.save();

  const changes = {};
  Object.keys(data).forEach((key) => {
    changes[key] = data[key];
  });

  await logHistory(
    vehicle._id,
    previousStatus !== vehicle.status ? VEHICLE_HISTORY_ACTIONS.STATUS_CHANGED : VEHICLE_HISTORY_ACTIONS.UPDATED,
    `Vehicle ${vehicle.vehicleNumber} updated`,
    userId,
    changes
  );
  await logActivity(
    ACTIVITY_TYPES.VEHICLE_UPDATED,
    'Vehicle updated',
    `${vehicle.vehicleNumber} details updated`,
    userId,
    vehicle._id
  );

  return Vehicle.findById(vehicle._id).populate(populateOptions).lean();
};

export const deleteVehicle = async (id, userId) => {
  const vehicle = await Vehicle.findOne({ _id: id, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (vehicle.assignedDriver) {
    await Driver.findByIdAndUpdate(vehicle.assignedDriver, { assignedVehicle: null });
  }

  vehicle.isDeleted = true;
  vehicle.deletedAt = new Date();
  vehicle.status = VEHICLE_STATUS.INACTIVE;
  vehicle.updatedBy = userId;
  await vehicle.save();

  await logHistory(
    vehicle._id,
    VEHICLE_HISTORY_ACTIONS.DELETED,
    `Vehicle ${vehicle.vehicleNumber} deleted`,
    userId
  );
  await logActivity(
    ACTIVITY_TYPES.VEHICLE_DELETED,
    'Vehicle deleted',
    `${vehicle.vehicleNumber} removed from fleet`,
    userId,
    vehicle._id
  );

  return { message: 'Vehicle deleted successfully' };
};

export const assignDriver = async (vehicleId, driverId, userId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  if (vehicle.assignedDriver && vehicle.assignedDriver.toString() !== driverId) {
    await Driver.findByIdAndUpdate(vehicle.assignedDriver, { assignedVehicle: null });
  }

  if (driver.assignedVehicle && driver.assignedVehicle.toString() !== vehicleId) {
    await Vehicle.findByIdAndUpdate(driver.assignedVehicle, { assignedDriver: null });
  }

  vehicle.assignedDriver = driverId;
  vehicle.updatedBy = userId;
  await vehicle.save();

  driver.assignedVehicle = vehicleId;
  await driver.save();

  await logHistory(
    vehicle._id,
    VEHICLE_HISTORY_ACTIONS.ASSIGNED,
    `${driver.firstName} ${driver.lastName} assigned to ${vehicle.vehicleNumber}`,
    userId,
    { driverId }
  );
  await logActivity(
    ACTIVITY_TYPES.DRIVER_ASSIGNED,
    'Driver assigned to vehicle',
    `${driver.firstName} ${driver.lastName} → ${vehicle.vehicleNumber}`,
    userId,
    vehicle._id
  );

  await notifyDriverEvent(driverId, {
    title: 'Vehicle Assigned',
    message: `You have been assigned to vehicle ${vehicle.vehicleNumber}`,
    entityType: 'vehicle',
    entityId: vehicle._id,
    metadata: { vehicleNumber: vehicle.vehicleNumber, event: 'vehicle_assigned' },
  });

  return Vehicle.findById(vehicle._id).populate(populateOptions).lean();
};

export const unassignDriver = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (!vehicle.assignedDriver) throw new AppError('No driver assigned to this vehicle', 400);

  const driver = await Driver.findById(vehicle.assignedDriver);
  vehicle.assignedDriver = null;
  vehicle.updatedBy = userId;
  await vehicle.save();

  if (driver) {
    driver.assignedVehicle = null;
    await driver.save();
  }

  await logHistory(
    vehicle._id,
    VEHICLE_HISTORY_ACTIONS.UNASSIGNED,
    `Driver unassigned from ${vehicle.vehicleNumber}`,
    userId
  );

  return Vehicle.findById(vehicle._id).populate(populateOptions).lean();
};

export const uploadVehicleImage = async (vehicleId, file, userId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const { url, publicId } = await uploadImage(file.buffer, file.originalname, file.mimetype);
  vehicle.images.push({ url, publicId });
  if (!vehicle.image) vehicle.image = url;
  vehicle.updatedBy = userId;
  await vehicle.save();

  await logHistory(
    vehicle._id,
    VEHICLE_HISTORY_ACTIONS.IMAGE_ADDED,
    `Image added to ${vehicle.vehicleNumber}`,
    userId
  );

  return Vehicle.findById(vehicle._id).populate(populateOptions).lean();
};

export const deleteVehicleImage = async (vehicleId, publicId, userId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const imageIndex = vehicle.images.findIndex((img) => img.publicId === publicId || img.url.includes(publicId));
  if (imageIndex === -1) throw new AppError('Image not found', 404);

  const [removed] = vehicle.images.splice(imageIndex, 1);
  await deleteImage(removed.publicId);

  if (vehicle.image === removed.url) {
    vehicle.image = vehicle.images[0]?.url || null;
  }
  vehicle.updatedBy = userId;
  await vehicle.save();

  await logHistory(
    vehicle._id,
    VEHICLE_HISTORY_ACTIONS.IMAGE_REMOVED,
    `Image removed from ${vehicle.vehicleNumber}`,
    userId
  );

  return Vehicle.findById(vehicle._id).populate(populateOptions).lean();
};

export const getVehicleHistory = async (vehicleId, query) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const { page, limit, skip, sort } = getPagination(query);

  const [history, total] = await Promise.all([
    VehicleHistory.find({ vehicle: vehicleId })
      .populate('performedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    VehicleHistory.countDocuments({ vehicle: vehicleId }),
  ]);

  return {
    history,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const exportVehiclesCSV = async (query) => {
  const filter = buildFilter(query);
  const vehicles = await Vehicle.find(filter).populate(populateOptions).sort({ createdAt: -1 }).lean();

  const columns = [
    { header: 'Vehicle Number', accessor: 'vehicleNumber' },
    { header: 'VIN', accessor: 'vin' },
    { header: 'Manufacturer', accessor: 'manufacturer' },
    { header: 'Model', accessor: 'model' },
    { header: 'Year', accessor: 'year' },
    { header: 'Status', accessor: 'status' },
    { header: 'Fuel Type', accessor: 'fuelType' },
    { header: 'Odometer', accessor: 'odometer' },
    { header: 'Fuel Level %', accessor: 'fuelLevel' },
    { header: 'RC Number', accessor: 'registrationNumber' },
    {
      header: 'Assigned Driver',
      accessor: (v) => (v.assignedDriver ? `${v.assignedDriver.firstName} ${v.assignedDriver.lastName}` : ''),
    },
    {
      header: 'Insurance Expiry',
      accessor: (v) => (v.documentExpiry?.insurance ? new Date(v.documentExpiry.insurance).toISOString().split('T')[0] : ''),
    },
    {
      header: 'Registration Expiry',
      accessor: (v) => (v.documentExpiry?.registration ? new Date(v.documentExpiry.registration).toISOString().split('T')[0] : ''),
    },
    { header: 'Created At', accessor: (v) => new Date(v.createdAt).toISOString() },
  ];

  return objectsToCSV(vehicles, columns);
};

export const getVehicleStats = async () => {
  const notDeleted = { isDeleted: false };
  const [total, active, maintenance, inactive, retired, assigned, unassigned] = await Promise.all([
    Vehicle.countDocuments(notDeleted),
    Vehicle.countDocuments({ ...notDeleted, status: VEHICLE_STATUS.ACTIVE }),
    Vehicle.countDocuments({ ...notDeleted, status: VEHICLE_STATUS.MAINTENANCE }),
    Vehicle.countDocuments({ ...notDeleted, status: VEHICLE_STATUS.INACTIVE }),
    Vehicle.countDocuments({ ...notDeleted, status: VEHICLE_STATUS.RETIRED }),
    Vehicle.countDocuments({ ...notDeleted, assignedDriver: { $ne: null } }),
    Vehicle.countDocuments({ ...notDeleted, assignedDriver: null }),
  ]);

  return { total, active, maintenance, inactive, retired, assigned, unassigned };
};

export const getAvailableDrivers = async () => {
  const drivers = await Driver.find({ isDeleted: false })
    .select('firstName lastName employeeId status assignedVehicle performanceScore')
    .populate('assignedVehicle', 'vehicleNumber')
    .sort({ firstName: 1 })
    .lean();

  return drivers;
};

export default {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignDriver,
  unassignDriver,
  uploadVehicleImage,
  deleteVehicleImage,
  getVehicleHistory,
  exportVehiclesCSV,
  getVehicleStats,
  getAvailableDrivers,
};
