import Mechanic from '../models/Mechanic.js';
import MechanicHistory from '../models/MechanicHistory.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import { MECHANIC_STATUS, MECHANIC_HISTORY_ACTIONS, ACTIVITY_TYPES } from '../constants/enums.js';
import { linkMechanicProfileToUser, syncMechanicProfilesFromUsers } from '../utils/mechanicUserLink.js';

const userPopulate = { path: 'user', select: 'firstName lastName email isActive' };

const logHistory = async (mechanicId, action, description, userId, changes = null) => {
  await MechanicHistory.create({ mechanic: mechanicId, action, description, performedBy: userId, changes });
};

const logActivity = async (type, title, description, userId, entityId) => {
  await Activity.create({ type, title, description, entityType: 'mechanic', entityId, user: userId });
};

const buildFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.status) filter.status = query.status;
  if (query.specialization) filter.specialization = query.specialization;
  if (query.minScore) filter.performanceScore = { $gte: parseInt(query.minScore, 10) };

  if (query.search) {
    filter.$or = [
      { firstName: new RegExp(query.search, 'i') },
      { lastName: new RegExp(query.search, 'i') },
      { email: new RegExp(query.search, 'i') },
      { employeeId: new RegExp(query.search, 'i') },
      { certificationNumber: new RegExp(query.search, 'i') },
      { phone: new RegExp(query.search, 'i') },
    ];
  }

  return filter;
};

export const getMechanics = async (query) => {
  await syncMechanicProfilesFromUsers();

  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);

  const [mechanics, total] = await Promise.all([
    Mechanic.find(filter).populate(userPopulate).sort(sort).skip(skip).limit(limit).lean(),
    Mechanic.countDocuments(filter),
  ]);

  return { mechanics, pagination: buildPaginationMeta(total, page, limit) };
};

export const getMechanicById = async (id) => {
  const mechanic = await Mechanic.findOne({ _id: id, isDeleted: false }).populate(userPopulate).lean();
  if (!mechanic) throw new AppError('Mechanic not found', 404);
  return mechanic;
};

export const createMechanic = async (data, userId) => {
  if (data.employeeId) {
    const dup = await Mechanic.findOne({ employeeId: data.employeeId, isDeleted: false });
    if (dup) throw new AppError('Employee ID already exists', 409);
  }

  if (data.certificationNumber) {
    const dupCert = await Mechanic.findOne({ certificationNumber: data.certificationNumber, isDeleted: false });
    if (dupCert) throw new AppError('Certification number already registered', 409);
  }

  const mechanic = await Mechanic.create({ ...data, createdBy: userId, updatedBy: userId });
  await linkMechanicProfileToUser(mechanic);

  await logHistory(
    mechanic._id,
    MECHANIC_HISTORY_ACTIONS.CREATED,
    `Mechanic ${mechanic.firstName} ${mechanic.lastName} created`,
    userId
  );
  await logActivity(
    ACTIVITY_TYPES.MECHANIC_ADDED,
    'Mechanic added',
    `${mechanic.firstName} ${mechanic.lastName} (${mechanic.employeeId || mechanic.certificationNumber})`,
    userId,
    mechanic._id
  );

  return Mechanic.findById(mechanic._id).populate(userPopulate).lean();
};

export const updateMechanic = async (id, data, userId) => {
  const mechanic = await Mechanic.findOne({ _id: id, isDeleted: false });
  if (!mechanic) throw new AppError('Mechanic not found', 404);

  if (data.employeeId && data.employeeId !== mechanic.employeeId) {
    const dup = await Mechanic.findOne({ employeeId: data.employeeId, isDeleted: false, _id: { $ne: id } });
    if (dup) throw new AppError('Employee ID already exists', 409);
  }

  if (data.certificationNumber && data.certificationNumber !== mechanic.certificationNumber) {
    const dupCert = await Mechanic.findOne({
      certificationNumber: data.certificationNumber,
      isDeleted: false,
      _id: { $ne: id },
    });
    if (dupCert) throw new AppError('Certification number already registered', 409);
  }

  const previousStatus = mechanic.status;
  Object.assign(mechanic, data, { updatedBy: userId });
  await mechanic.save();
  await linkMechanicProfileToUser(mechanic);

  await logHistory(
    mechanic._id,
    previousStatus !== mechanic.status ? MECHANIC_HISTORY_ACTIONS.STATUS_CHANGED : MECHANIC_HISTORY_ACTIONS.UPDATED,
    `Mechanic ${mechanic.firstName} ${mechanic.lastName} updated`,
    userId,
    data
  );
  await logActivity(
    ACTIVITY_TYPES.MECHANIC_UPDATED,
    'Mechanic updated',
    `${mechanic.firstName} ${mechanic.lastName} profile updated`,
    userId,
    mechanic._id
  );

  return Mechanic.findById(mechanic._id).populate(userPopulate).lean();
};

export const deleteMechanic = async (id, userId) => {
  const mechanic = await Mechanic.findOne({ _id: id, isDeleted: false });
  if (!mechanic) throw new AppError('Mechanic not found', 404);

  mechanic.isDeleted = true;
  mechanic.deletedAt = new Date();
  mechanic.status = MECHANIC_STATUS.UNAVAILABLE;
  mechanic.updatedBy = userId;
  await mechanic.save();

  await logHistory(
    mechanic._id,
    MECHANIC_HISTORY_ACTIONS.DELETED,
    `Mechanic ${mechanic.firstName} ${mechanic.lastName} deleted`,
    userId
  );
  await logActivity(
    ACTIVITY_TYPES.MECHANIC_DELETED,
    'Mechanic deleted',
    `${mechanic.firstName} ${mechanic.lastName} removed from fleet`,
    userId,
    mechanic._id
  );

  return { message: 'Mechanic deleted successfully' };
};

export const uploadAvatar = async (mechanicId, file, userId) => {
  const mechanic = await Mechanic.findOne({ _id: mechanicId, isDeleted: false });
  if (!mechanic) throw new AppError('Mechanic not found', 404);

  const { url } = await uploadImage(file.buffer, file.originalname, file.mimetype, 'mechanics');
  mechanic.avatar = url;
  mechanic.updatedBy = userId;
  await mechanic.save();

  await logHistory(mechanic._id, MECHANIC_HISTORY_ACTIONS.AVATAR_UPDATED, 'Profile photo updated', userId);

  return Mechanic.findById(mechanic._id).populate(userPopulate).lean();
};

export const uploadDocument = async (mechanicId, file, meta, userId) => {
  const mechanic = await Mechanic.findOne({ _id: mechanicId, isDeleted: false });
  if (!mechanic) throw new AppError('Mechanic not found', 404);

  const folder = file.mimetype === 'application/pdf' ? 'documents' : 'mechanics';
  const { url, publicId } = await uploadImage(file.buffer, file.originalname, file.mimetype, folder);

  mechanic.documents.push({
    type: meta.type || 'other',
    name: meta.name || file.originalname,
    url,
    publicId,
    expiryDate: meta.expiryDate ? new Date(meta.expiryDate) : null,
  });
  mechanic.updatedBy = userId;
  await mechanic.save();

  await logHistory(
    mechanic._id,
    MECHANIC_HISTORY_ACTIONS.DOCUMENT_ADDED,
    `Document "${meta.name || file.originalname}" uploaded`,
    userId
  );

  return Mechanic.findById(mechanic._id).populate(userPopulate).lean();
};

export const deleteDocument = async (mechanicId, documentId, userId) => {
  const mechanic = await Mechanic.findOne({ _id: mechanicId, isDeleted: false });
  if (!mechanic) throw new AppError('Mechanic not found', 404);

  const doc = mechanic.documents.id(documentId);
  if (!doc) throw new AppError('Document not found', 404);

  await deleteImage(doc.publicId);
  mechanic.documents.pull(documentId);
  mechanic.updatedBy = userId;
  await mechanic.save();

  await logHistory(mechanic._id, MECHANIC_HISTORY_ACTIONS.DOCUMENT_REMOVED, 'Document removed', userId);

  return Mechanic.findById(mechanic._id).populate(userPopulate).lean();
};

export const getMechanicHistory = async (mechanicId, query) => {
  const mechanic = await Mechanic.findOne({ _id: mechanicId, isDeleted: false });
  if (!mechanic) throw new AppError('Mechanic not found', 404);

  const { page, limit, skip, sort } = getPagination(query);

  const [history, total] = await Promise.all([
    MechanicHistory.find({ mechanic: mechanicId })
      .populate('performedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MechanicHistory.countDocuments({ mechanic: mechanicId }),
  ]);

  return { history, pagination: buildPaginationMeta(total, page, limit) };
};

export const exportMechanicsCSV = async (query) => {
  const filter = buildFilter(query);
  const mechanics = await Mechanic.find(filter).populate(userPopulate).sort({ createdAt: -1 }).lean();

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'First Name', accessor: 'firstName' },
    { header: 'Last Name', accessor: 'lastName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Certification Number', accessor: 'certificationNumber' },
    {
      header: 'Certification Expiry',
      accessor: (m) => (m.certificationExpiry ? new Date(m.certificationExpiry).toISOString().split('T')[0] : ''),
    },
    { header: 'Specialization', accessor: 'specialization' },
    { header: 'Experience (yrs)', accessor: 'experienceYears' },
    { header: 'Status', accessor: 'status' },
    { header: 'Performance Score', accessor: 'performanceScore' },
    {
      header: 'Linked User',
      accessor: (m) => (m.user ? `${m.user.firstName} ${m.user.lastName} (${m.user.email})` : ''),
    },
    { header: 'Created At', accessor: (m) => new Date(m.createdAt).toISOString() },
  ];

  return objectsToCSV(mechanics, columns);
};

export const getMechanicStats = async () => {
  await syncMechanicProfilesFromUsers();

  const notDeleted = { isDeleted: false };
  const [total, available, onJob, offDuty, unavailable, avgScore] = await Promise.all([
    Mechanic.countDocuments(notDeleted),
    Mechanic.countDocuments({ ...notDeleted, status: MECHANIC_STATUS.AVAILABLE }),
    Mechanic.countDocuments({ ...notDeleted, status: MECHANIC_STATUS.ON_JOB }),
    Mechanic.countDocuments({ ...notDeleted, status: MECHANIC_STATUS.OFF_DUTY }),
    Mechanic.countDocuments({ ...notDeleted, status: MECHANIC_STATUS.UNAVAILABLE }),
    Mechanic.aggregate([{ $match: notDeleted }, { $group: { _id: null, avg: { $avg: '$performanceScore' } } }]),
  ]);

  return {
    total,
    available,
    onJob,
    offDuty,
    unavailable,
    averagePerformanceScore: Math.round((avgScore[0]?.avg || 0) * 10) / 10,
  };
};

export default {
  getMechanics,
  getMechanicById,
  createMechanic,
  updateMechanic,
  deleteMechanic,
  uploadAvatar,
  uploadDocument,
  deleteDocument,
  getMechanicHistory,
  exportMechanicsCSV,
  getMechanicStats,
};
