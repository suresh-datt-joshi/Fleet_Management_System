import FleetDocument from '../models/FleetDocument.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Activity from '../models/Activity.js';
import Alert from '../models/Alert.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { uploadFile, deleteFile } from './cloudinaryService.js';
import {
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  ACTIVITY_TYPES,
  ALERT_TYPES,
  ALERT_SEVERITY,
} from '../constants/enums.js';

const vehiclePopulate = { path: 'vehicle', select: 'vehicleNumber model manufacturer' };
const driverPopulate = { path: 'driver', select: 'firstName lastName employeeId' };

export const computeDocumentStatus = (expiryDate, reminderDaysBefore = 30) => {
  if (!expiryDate) return DOCUMENT_STATUS.ACTIVE;

  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry < now) return DOCUMENT_STATUS.EXPIRED;

  const reminderDate = new Date(expiry);
  reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);
  if (now >= reminderDate) return DOCUMENT_STATUS.EXPIRING_SOON;

  return DOCUMENT_STATUS.ACTIVE;
};

const formatDocument = (doc) => {
  const d = doc.toObject ? doc.toObject() : doc;
  const status = computeDocumentStatus(d.expiryDate, d.reminderDaysBefore);

  return {
    id: d._id,
    documentNumber: d.documentNumber,
    title: d.title,
    description: d.description,
    type: d.type,
    entityType: d.entityType,
    vehicle: d.vehicle
      ? {
          id: d.vehicle._id || d.vehicle,
          vehicleNumber: d.vehicle.vehicleNumber,
          model: d.vehicle.model,
        }
      : null,
    driver: d.driver
      ? {
          id: d.driver._id || d.driver,
          name: d.driver.firstName ? `${d.driver.firstName} ${d.driver.lastName}` : null,
          employeeId: d.driver.employeeId,
        }
      : null,
    fileUrl: d.fileUrl,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    issueDate: d.issueDate,
    expiryDate: d.expiryDate,
    status,
    reminderDaysBefore: d.reminderDaysBefore,
    daysUntilExpiry: d.expiryDate
      ? Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
    notes: d.notes,
    tags: d.tags || [],
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
};

const generateDocumentNumber = async () => {
  const prefix = `DOC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const count = await FleetDocument.countDocuments({ documentNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

const logActivity = async (type, title, description, userId, entityId) => {
  await Activity.create({
    type,
    title,
    description,
    entityType: 'document',
    entityId,
    user: userId,
  });
};

const createExpiryAlert = async (document) => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recent = await Alert.findOne({
    type: ALERT_TYPES.DOCUMENT_EXPIRY,
    'metadata.documentId': document._id,
    createdAt: { $gte: fiveMinAgo },
  });
  if (recent) return;

  const status = computeDocumentStatus(document.expiryDate, document.reminderDaysBefore);
  if (status === DOCUMENT_STATUS.ACTIVE) return;

  const severity = status === DOCUMENT_STATUS.EXPIRED ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM;
  const title = status === DOCUMENT_STATUS.EXPIRED ? 'Document Expired' : 'Document Expiring Soon';

  await Alert.create({
    type: ALERT_TYPES.DOCUMENT_EXPIRY,
    severity,
    title,
    message: `${document.title} (${document.documentNumber}) ${status === DOCUMENT_STATUS.EXPIRED ? 'has expired' : 'is expiring soon'}`,
    vehicle: document.vehicle || null,
    driver: document.driver || null,
    metadata: { documentId: document._id, documentNumber: document.documentNumber },
  });
};

export const syncDocumentStatuses = async () => {
  const docs = await FleetDocument.find({ isDeleted: false, expiryDate: { $ne: null } });

  for (const doc of docs) {
    const status = computeDocumentStatus(doc.expiryDate, doc.reminderDaysBefore);
    if (doc.status !== status) {
      doc.status = status;
      await doc.save();
    }
    if ([DOCUMENT_STATUS.EXPIRING_SOON, DOCUMENT_STATUS.EXPIRED].includes(status)) {
      await createExpiryAlert(doc);
    }
  }
};

const buildFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.type) filter.type = query.type;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.driverId) filter.driver = query.driverId;
  if (query.status) filter.status = query.status;

  if (query.expiring === 'true') {
    filter.expiryDate = { $ne: null, $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
    filter.status = { $in: [DOCUMENT_STATUS.EXPIRING_SOON, DOCUMENT_STATUS.EXPIRED] };
  }

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ title: regex }, { documentNumber: regex }, { description: regex }, { fileName: regex }];
  }

  return filter;
};

const resolveEntity = async (data) => {
  let entityType = data.entityType || DOCUMENT_ENTITY_TYPES.FLEET;
  let vehicleId = null;
  let driverId = null;

  if (data.vehicleId) {
    const vehicle = await Vehicle.findOne({ _id: data.vehicleId, isDeleted: false });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    entityType = DOCUMENT_ENTITY_TYPES.VEHICLE;
    vehicleId = data.vehicleId;
  } else if (data.driverId) {
    const driver = await Driver.findOne({ _id: data.driverId, isDeleted: false });
    if (!driver) throw new AppError('Driver not found', 404);
    entityType = DOCUMENT_ENTITY_TYPES.DRIVER;
    driverId = data.driverId;
  }

  return { entityType, vehicleId, driverId };
};

export const getDocuments = async (query) => {
  await syncDocumentStatuses();

  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);

  const [documents, total] = await Promise.all([
    FleetDocument.find(filter)
      .populate(vehiclePopulate)
      .populate(driverPopulate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FleetDocument.countDocuments(filter),
  ]);

  return {
    documents: documents.map(formatDocument),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getDocumentById = async (id) => {
  const doc = await FleetDocument.findOne({ _id: id, isDeleted: false })
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .lean();

  if (!doc) throw new AppError('Document not found', 404);
  return formatDocument(doc);
};

export const getDocumentStats = async () => {
  await syncDocumentStatuses();

  const notDeleted = { isDeleted: false };
  const [total, expiringSoon, expired, byType] = await Promise.all([
    FleetDocument.countDocuments(notDeleted),
    FleetDocument.countDocuments({ ...notDeleted, status: DOCUMENT_STATUS.EXPIRING_SOON }),
    FleetDocument.countDocuments({ ...notDeleted, status: DOCUMENT_STATUS.EXPIRED }),
    FleetDocument.aggregate([
      { $match: notDeleted },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    total,
    expiringSoon,
    expired,
    active: total - expiringSoon - expired,
    byType: byType.map((t) => ({ type: t._id, count: t.count })),
  };
};

export const getExpiringDocuments = async (query = {}) => {
  await syncDocumentStatuses();

  const days = parseInt(query.days, 10) || 30;
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const documents = await FleetDocument.find({
    isDeleted: false,
    expiryDate: { $ne: null, $lte: until },
    status: { $in: [DOCUMENT_STATUS.EXPIRING_SOON, DOCUMENT_STATUS.EXPIRED] },
  })
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .sort({ expiryDate: 1 })
    .limit(parseInt(query.limit, 10) || 50)
    .lean();

  return documents.map(formatDocument);
};

export const getDocumentAnalytics = async () => {
  await syncDocumentStatuses();

  const notDeleted = { isDeleted: false };
  const [byType, byEntity, byStatus] = await Promise.all([
    FleetDocument.aggregate([
      { $match: notDeleted },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    FleetDocument.aggregate([
      { $match: notDeleted },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
    ]),
    FleetDocument.aggregate([
      { $match: notDeleted },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    byType: byType.map((t) => ({ type: t._id, count: t.count })),
    byEntity: byEntity.map((e) => ({ entityType: e._id, count: e.count })),
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
  };
};

export const createDocument = async (file, data, userId) => {
  if (!file) throw new AppError('Document file is required', 400);

  const { entityType, vehicleId, driverId } = await resolveEntity(data);

  const upload = await uploadFile(file.buffer, file.originalname, file.mimetype, 'documents');
  const documentNumber = await generateDocumentNumber();
  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  const reminderDaysBefore = data.reminderDaysBefore ? parseInt(data.reminderDaysBefore, 10) : 30;
  const status = computeDocumentStatus(expiryDate, reminderDaysBefore);

  const doc = await FleetDocument.create({
    documentNumber,
    title: data.title,
    description: data.description || '',
    type: data.type,
    entityType,
    vehicle: vehicleId,
    driver: driverId,
    fileUrl: upload.url,
    publicId: upload.publicId,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    issueDate: data.issueDate ? new Date(data.issueDate) : null,
    expiryDate,
    status,
    reminderDaysBefore,
    notes: data.notes || '',
    tags: data.tags ? (Array.isArray(data.tags) ? data.tags : data.tags.split(',').map((t) => t.trim())) : [],
    createdBy: userId,
    updatedBy: userId,
  });

  await logActivity(
    ACTIVITY_TYPES.DOCUMENT_UPLOADED,
    'Document uploaded',
    `${doc.documentNumber} — ${doc.title}`,
    userId,
    doc._id
  );

  if ([DOCUMENT_STATUS.EXPIRING_SOON, DOCUMENT_STATUS.EXPIRED].includes(status)) {
    await createExpiryAlert(doc);
  }

  const populated = await FleetDocument.findById(doc._id)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .lean();

  return formatDocument(populated);
};

export const updateDocument = async (id, data, userId) => {
  const doc = await FleetDocument.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new AppError('Document not found', 404);

  if (data.vehicleId || data.driverId) {
    const resolved = await resolveEntity({
      vehicleId: data.vehicleId || (data.entityType === DOCUMENT_ENTITY_TYPES.VEHICLE ? doc.vehicle : null),
      driverId: data.driverId || (data.entityType === DOCUMENT_ENTITY_TYPES.DRIVER ? doc.driver : null),
      entityType: data.entityType,
    });
    doc.entityType = resolved.entityType;
    doc.vehicle = resolved.vehicleId;
    doc.driver = resolved.driverId;
  } else if (data.entityType === DOCUMENT_ENTITY_TYPES.FLEET) {
    doc.entityType = DOCUMENT_ENTITY_TYPES.FLEET;
    doc.vehicle = null;
    doc.driver = null;
  }

  ['title', 'description', 'type', 'notes'].forEach((field) => {
    if (data[field] !== undefined) doc[field] = data[field];
  });

  if (data.issueDate !== undefined) doc.issueDate = data.issueDate ? new Date(data.issueDate) : null;
  if (data.expiryDate !== undefined) doc.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  if (data.reminderDaysBefore !== undefined) doc.reminderDaysBefore = parseInt(data.reminderDaysBefore, 10);
  if (data.tags !== undefined) {
    doc.tags = Array.isArray(data.tags) ? data.tags : data.tags.split(',').map((t) => t.trim());
  }

  doc.status = computeDocumentStatus(doc.expiryDate, doc.reminderDaysBefore);
  doc.updatedBy = userId;
  await doc.save();

  if ([DOCUMENT_STATUS.EXPIRING_SOON, DOCUMENT_STATUS.EXPIRED].includes(doc.status)) {
    await createExpiryAlert(doc);
  }

  const populated = await FleetDocument.findById(doc._id)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .lean();

  return formatDocument(populated);
};

export const replaceDocumentFile = async (id, file, userId) => {
  const doc = await FleetDocument.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new AppError('Document not found', 404);
  if (!file) throw new AppError('Document file is required', 400);

  if (doc.publicId) await deleteFile(doc.publicId);

  const upload = await uploadFile(file.buffer, file.originalname, file.mimetype, 'documents');
  doc.fileUrl = upload.url;
  doc.publicId = upload.publicId;
  doc.fileName = file.originalname;
  doc.fileSize = file.size;
  doc.mimeType = file.mimetype;
  doc.updatedBy = userId;
  await doc.save();

  const populated = await FleetDocument.findById(doc._id)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .lean();

  return formatDocument(populated);
};

export const deleteDocument = async (id, userId) => {
  const doc = await FleetDocument.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new AppError('Document not found', 404);

  if (doc.publicId) await deleteFile(doc.publicId);

  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.status = DOCUMENT_STATUS.ARCHIVED;
  doc.updatedBy = userId;
  await doc.save();

  return { message: 'Document deleted successfully' };
};

export const getMetaVehicles = async () => {
  const vehicles = await Vehicle.find({ isDeleted: false })
    .select('vehicleNumber model manufacturer')
    .sort({ vehicleNumber: 1 })
    .lean();
  return vehicles.map((v) => ({ id: v._id, vehicleNumber: v.vehicleNumber, model: v.model }));
};

export const getMetaDrivers = async () => {
  const drivers = await Driver.find({ isDeleted: false })
    .select('firstName lastName employeeId')
    .sort({ firstName: 1 })
    .lean();
  return drivers.map((d) => ({
    id: d._id,
    name: `${d.firstName} ${d.lastName}`,
    employeeId: d.employeeId,
  }));
};

export const exportDocumentsCSV = async (query) => {
  await syncDocumentStatuses();
  const filter = buildFilter(query);
  const documents = await FleetDocument.find(filter)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .sort({ expiryDate: 1 })
    .limit(5000)
    .lean();

  const columns = [
    { header: 'Document #', accessor: 'documentNumber' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'type' },
    { header: 'Entity', accessor: 'entityType' },
    { header: 'Vehicle', accessor: (d) => d.vehicle?.vehicleNumber || '' },
    { header: 'Driver', accessor: (d) => (d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : '') },
    { header: 'Issue Date', accessor: (d) => (d.issueDate ? new Date(d.issueDate).toISOString().split('T')[0] : '') },
    { header: 'Expiry Date', accessor: (d) => (d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : '') },
    { header: 'Status', accessor: 'status' },
    { header: 'File', accessor: 'fileName' },
  ];

  return objectsToCSV(documents, columns);
};

export default {
  getDocuments,
  getDocumentById,
  getDocumentStats,
  getExpiringDocuments,
  getDocumentAnalytics,
  createDocument,
  updateDocument,
  replaceDocumentFile,
  deleteDocument,
  getMetaVehicles,
  getMetaDrivers,
  exportDocumentsCSV,
  syncDocumentStatuses,
  computeDocumentStatus,
};
