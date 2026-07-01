import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import DriverHistory from '../models/DriverHistory.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { DRIVER_STATUS, DRIVER_HISTORY_ACTIONS, ACTIVITY_TYPES } from '../constants/enums.js';
import { linkDriverProfileToUser } from '../utils/driverUserLink.js';
import { notifyDriverEvent } from './alertService.js';

const vehiclePopulate = {
  path: 'assignedVehicle',
  select: 'vehicleNumber model manufacturer status fuelLevel',
};

const logHistory = async (driverId, action, description, userId, changes = null) => {
  await DriverHistory.create({ driver: driverId, action, description, performedBy: userId, changes });
};

const logActivity = async (type, title, description, userId, entityId) => {
  await Activity.create({ type, title, description, entityType: 'driver', entityId, user: userId });
};

const buildFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.status) filter.status = query.status;

  if (query.assigned === 'true') filter.assignedVehicle = { $ne: null };
  else if (query.assigned === 'false') filter.assignedVehicle = null;

  if (query.minScore) filter.performanceScore = { $gte: parseInt(query.minScore, 10) };

  if (query.search) {
    const escapedSearch = escapeRegex(query.search);
    filter.$or = [
      { firstName: new RegExp(escapedSearch, 'i') },
      { lastName: new RegExp(escapedSearch, 'i') },
      { email: new RegExp(escapedSearch, 'i') },
      { employeeId: new RegExp(escapedSearch, 'i') },
      { licenseNumber: new RegExp(escapedSearch, 'i') },
      { phone: new RegExp(escapedSearch, 'i') },
    ];
  }

  return filter;
};

export const getDrivers = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);

  const [drivers, total] = await Promise.all([
    Driver.find(filter).populate(vehiclePopulate).sort(sort).skip(skip).limit(limit).lean(),
    Driver.countDocuments(filter),
  ]);

  return { drivers, pagination: buildPaginationMeta(total, page, limit) };
};

export const getDriverById = async (id) => {
  const driver = await Driver.findOne({ _id: id, isDeleted: false }).populate(vehiclePopulate).lean();
  if (!driver) throw new AppError('Driver not found', 404);
  return driver;
};

export const createDriver = async (data, userId) => {
  if (data.employeeId) {
    const dup = await Driver.findOne({ employeeId: data.employeeId, isDeleted: false });
    if (dup) throw new AppError('Employee ID already exists', 409);
  }

  if (data.licenseNumber) {
    const dupLicense = await Driver.findOne({ licenseNumber: data.licenseNumber, isDeleted: false });
    if (dupLicense) throw new AppError('License number already registered', 409);
  }

  const driver = await Driver.create({ ...data, createdBy: userId, updatedBy: userId });
  await linkDriverProfileToUser(driver);

  await logHistory(driver._id, DRIVER_HISTORY_ACTIONS.CREATED, `Driver ${driver.firstName} ${driver.lastName} created`, userId);
  await logActivity(
    ACTIVITY_TYPES.DRIVER_ADDED,
    'Driver added',
    `${driver.firstName} ${driver.lastName} (${driver.employeeId || driver.licenseNumber})`,
    userId,
    driver._id
  );

  return Driver.findById(driver._id).populate(vehiclePopulate).lean();
};

export const updateDriver = async (id, data, userId) => {
  const driver = await Driver.findOne({ _id: id, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  if (data.employeeId && data.employeeId !== driver.employeeId) {
    const dup = await Driver.findOne({ employeeId: data.employeeId, isDeleted: false, _id: { $ne: id } });
    if (dup) throw new AppError('Employee ID already exists', 409);
  }

  if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
    const dupLicense = await Driver.findOne({ licenseNumber: data.licenseNumber, isDeleted: false, _id: { $ne: id } });
    if (dupLicense) throw new AppError('License number already registered', 409);
  }

  const previousStatus = driver.status;
  Object.assign(driver, data, { updatedBy: userId });
  await driver.save();
  await linkDriverProfileToUser(driver);

  await logHistory(
    driver._id,
    previousStatus !== driver.status ? DRIVER_HISTORY_ACTIONS.STATUS_CHANGED : DRIVER_HISTORY_ACTIONS.UPDATED,
    `Driver ${driver.firstName} ${driver.lastName} updated`,
    userId,
    data
  );
  await logActivity(
    ACTIVITY_TYPES.DRIVER_UPDATED,
    'Driver updated',
    `${driver.firstName} ${driver.lastName} profile updated`,
    userId,
    driver._id
  );

  return Driver.findById(driver._id).populate(vehiclePopulate).lean();
};

export const deleteDriver = async (id, userId) => {
  const driver = await Driver.findOne({ _id: id, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  if (driver.assignedVehicle) {
    await Vehicle.findByIdAndUpdate(driver.assignedVehicle, { assignedDriver: null });
  }

  driver.isDeleted = true;
  driver.deletedAt = new Date();
  driver.status = DRIVER_STATUS.SUSPENDED;
  driver.assignedVehicle = null;
  driver.updatedBy = userId;
  await driver.save();

  await logHistory(driver._id, DRIVER_HISTORY_ACTIONS.DELETED, `Driver ${driver.firstName} ${driver.lastName} deleted`, userId);
  await logActivity(
    ACTIVITY_TYPES.DRIVER_DELETED,
    'Driver deleted',
    `${driver.firstName} ${driver.lastName} removed from fleet`,
    userId,
    driver._id
  );

  return { message: 'Driver deleted successfully' };
};

export const assignVehicle = async (driverId, vehicleId, userId) => {
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (driver.assignedVehicle && driver.assignedVehicle.toString() !== vehicleId) {
    await Vehicle.findByIdAndUpdate(driver.assignedVehicle, { assignedDriver: null });
  }

  if (vehicle.assignedDriver && vehicle.assignedDriver.toString() !== driverId) {
    await Driver.findByIdAndUpdate(vehicle.assignedDriver, { assignedVehicle: null });
  }

  driver.assignedVehicle = vehicleId;
  driver.updatedBy = userId;
  await driver.save();

  vehicle.assignedDriver = driverId;
  await vehicle.save();

  await logHistory(
    driver._id,
    DRIVER_HISTORY_ACTIONS.VEHICLE_ASSIGNED,
    `Assigned to vehicle ${vehicle.vehicleNumber}`,
    userId,
    { vehicleId }
  );
  await logActivity(
    ACTIVITY_TYPES.DRIVER_ASSIGNED,
    'Driver assigned to vehicle',
    `${driver.firstName} ${driver.lastName} → ${vehicle.vehicleNumber}`,
    userId,
    driver._id
  );

  await notifyDriverEvent(driverId, {
    title: 'Vehicle Assigned',
    message: `You have been assigned to vehicle ${vehicle.vehicleNumber}`,
    entityType: 'vehicle',
    entityId: vehicle._id,
    metadata: { vehicleNumber: vehicle.vehicleNumber, event: 'vehicle_assigned' },
  });

  return Driver.findById(driver._id).populate(vehiclePopulate).lean();
};

export const unassignVehicle = async (driverId, userId) => {
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  if (!driver.assignedVehicle) throw new AppError('No vehicle assigned to this driver', 400);

  const vehicle = await Vehicle.findById(driver.assignedVehicle);
  driver.assignedVehicle = null;
  driver.updatedBy = userId;
  await driver.save();

  if (vehicle) {
    vehicle.assignedDriver = null;
    await vehicle.save();
  }

  await logHistory(
    driver._id,
    DRIVER_HISTORY_ACTIONS.VEHICLE_UNASSIGNED,
    `Vehicle unassigned from ${driver.firstName} ${driver.lastName}`,
    userId
  );

  return Driver.findById(driver._id).populate(vehiclePopulate).lean();
};

export const uploadAvatar = async (driverId, file, userId) => {
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  const { url } = await uploadImage(file.buffer, file.originalname, file.mimetype, 'drivers');
  driver.avatar = url;
  driver.updatedBy = userId;
  await driver.save();

  await logHistory(driver._id, DRIVER_HISTORY_ACTIONS.AVATAR_UPDATED, 'Profile photo updated', userId);

  return Driver.findById(driver._id).populate(vehiclePopulate).lean();
};

export const uploadDocument = async (driverId, file, meta, userId) => {
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  const folder = file.mimetype === 'application/pdf' ? 'documents' : 'drivers';
  const { url, publicId } = await uploadImage(file.buffer, file.originalname, file.mimetype, folder);

  driver.documents.push({
    type: meta.type || 'other',
    name: meta.name || file.originalname,
    url,
    publicId,
    expiryDate: meta.expiryDate ? new Date(meta.expiryDate) : null,
  });
  driver.updatedBy = userId;
  await driver.save();

  await logHistory(driver._id, DRIVER_HISTORY_ACTIONS.DOCUMENT_ADDED, `Document "${meta.name || file.originalname}" uploaded`, userId);

  return Driver.findById(driver._id).populate(vehiclePopulate).lean();
};

export const deleteDocument = async (driverId, documentId, userId) => {
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  const doc = driver.documents.id(documentId);
  if (!doc) throw new AppError('Document not found', 404);

  await deleteImage(doc.publicId);
  driver.documents.pull(documentId);
  driver.updatedBy = userId;
  await driver.save();

  await logHistory(driver._id, DRIVER_HISTORY_ACTIONS.DOCUMENT_REMOVED, 'Document removed', userId);

  return Driver.findById(driver._id).populate(vehiclePopulate).lean();
};

export const getDriverHistory = async (driverId, query) => {
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  const { page, limit, skip, sort } = getPagination(query);

  const [history, total] = await Promise.all([
    DriverHistory.find({ driver: driverId })
      .populate('performedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    DriverHistory.countDocuments({ driver: driverId }),
  ]);

  return { history, pagination: buildPaginationMeta(total, page, limit) };
};

export const exportDriversCSV = async (query) => {
  const filter = buildFilter(query);
  const drivers = await Driver.find(filter).populate(vehiclePopulate).sort({ createdAt: -1 }).lean();

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'First Name', accessor: 'firstName' },
    { header: 'Last Name', accessor: 'lastName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'License Number', accessor: 'licenseNumber' },
    {
      header: 'License Expiry',
      accessor: (d) => (d.licenseExpiry ? new Date(d.licenseExpiry).toISOString().split('T')[0] : ''),
    },
    { header: 'Experience (yrs)', accessor: 'experienceYears' },
    {
      header: 'Medical Expiry',
      accessor: (d) => (d.medicalCertificateExpiry ? new Date(d.medicalCertificateExpiry).toISOString().split('T')[0] : ''),
    },
    { header: 'Status', accessor: 'status' },
    { header: 'Performance Score', accessor: 'performanceScore' },
    {
      header: 'Assigned Vehicle',
      accessor: (d) => (d.assignedVehicle ? d.assignedVehicle.vehicleNumber : ''),
    },
    {
      header: 'Emergency Contact',
      accessor: (d) => (d.emergencyContact?.name ? `${d.emergencyContact.name} (${d.emergencyContact.phone})` : ''),
    },
    { header: 'Created At', accessor: (d) => new Date(d.createdAt).toISOString() },
  ];

  return objectsToCSV(drivers, columns);
};

export const getDriverStats = async () => {
  const notDeleted = { isDeleted: false };
  const [total, available, onTrip, offDuty, suspended, assigned, avgScore] = await Promise.all([
    Driver.countDocuments(notDeleted),
    Driver.countDocuments({ ...notDeleted, status: DRIVER_STATUS.AVAILABLE }),
    Driver.countDocuments({ ...notDeleted, status: DRIVER_STATUS.ON_TRIP }),
    Driver.countDocuments({ ...notDeleted, status: DRIVER_STATUS.OFF_DUTY }),
    Driver.countDocuments({ ...notDeleted, status: DRIVER_STATUS.SUSPENDED }),
    Driver.countDocuments({ ...notDeleted, assignedVehicle: { $ne: null } }),
    Driver.aggregate([{ $match: notDeleted }, { $group: { _id: null, avg: { $avg: '$performanceScore' } } }]),
  ]);

  return {
    total,
    available,
    onTrip,
    offDuty,
    suspended,
    assigned,
    averagePerformanceScore: Math.round((avgScore[0]?.avg || 0) * 10) / 10,
  };
};

export const getAvailableVehicles = async () => {
  return Vehicle.find({ isDeleted: false, status: 'active' })
    .select('vehicleNumber model manufacturer assignedDriver status')
    .populate('assignedDriver', 'firstName lastName')
    .sort({ vehicleNumber: 1 })
    .lean();
};

export default {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  assignVehicle,
  unassignVehicle,
  uploadAvatar,
  uploadDocument,
  deleteDocument,
  getDriverHistory,
  exportDriversCSV,
  getDriverStats,
  getAvailableVehicles,
};
