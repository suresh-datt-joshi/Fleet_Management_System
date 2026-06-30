import Geofence from '../models/Geofence.js';
import GeofenceEvent from '../models/GeofenceEvent.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { GEOFENCE_TYPES } from '../constants/enums.js';

export const getGeofences = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = { isDeleted: false };

  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;

  const [geofences, total] = await Promise.all([
    Geofence.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Geofence.countDocuments(filter),
  ]);

  return {
    geofences: geofences.map(formatGeofence),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

const formatGeofence = (g) => ({
  id: g._id,
  name: g.name,
  description: g.description,
  type: g.type,
  center: g.center?.coordinates ? { lng: g.center.coordinates[0], lat: g.center.coordinates[1] } : null,
  radius: g.radius,
  polygon: g.polygon?.coordinates || null,
  color: g.color,
  isActive: g.isActive,
  alertOnEnter: g.alertOnEnter,
  alertOnExit: g.alertOnExit,
  speedLimit: g.speedLimit,
  createdAt: g.createdAt,
});

export const getGeofenceById = async (id) => {
  const geofence = await Geofence.findOne({ _id: id, isDeleted: false }).lean();
  if (!geofence) throw new AppError('Geofence not found', 404);
  return formatGeofence(geofence);
};

export const createGeofence = async (data, userId) => {
  const payload = { ...data, createdBy: userId, updatedBy: userId };

  if (data.type === GEOFENCE_TYPES.CIRCLE && data.center) {
    payload.center = {
      type: 'Point',
      coordinates: [data.center.lng, data.center.lat],
    };
  }

  if (data.type === GEOFENCE_TYPES.POLYGON && data.polygon) {
    payload.polygon = {
      type: 'Polygon',
      coordinates: data.polygon,
    };
  }

  const geofence = await Geofence.create(payload);
  return formatGeofence(geofence.toObject());
};

export const updateGeofence = async (id, data, userId) => {
  const geofence = await Geofence.findOne({ _id: id, isDeleted: false });
  if (!geofence) throw new AppError('Geofence not found', 404);

  if (data.center) {
    geofence.center = { type: 'Point', coordinates: [data.center.lng, data.center.lat] };
    delete data.center;
  }

  if (data.polygon) {
    geofence.polygon = { type: 'Polygon', coordinates: data.polygon };
    delete data.polygon;
  }

  Object.assign(geofence, data, { updatedBy: userId });
  await geofence.save();

  return formatGeofence(geofence.toObject());
};

export const deleteGeofence = async (id, userId) => {
  const geofence = await Geofence.findOne({ _id: id, isDeleted: false });
  if (!geofence) throw new AppError('Geofence not found', 404);

  geofence.isDeleted = true;
  geofence.deletedAt = new Date();
  geofence.isActive = false;
  geofence.updatedBy = userId;
  await geofence.save();

  return { message: 'Geofence deleted successfully' };
};

export const getGeofenceEvents = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};

  if (query.geofenceId) filter.geofence = query.geofenceId;
  if (query.vehicleId) filter.vehicle = query.vehicleId;

  const [events, total] = await Promise.all([
    GeofenceEvent.find(filter)
      .populate('geofence', 'name')
      .populate('vehicle', 'vehicleNumber model')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    GeofenceEvent.countDocuments(filter),
  ]);

  return {
    events: events.map((e) => ({
      id: e._id,
      eventType: e.eventType,
      geofence: e.geofence ? { id: e.geofence._id, name: e.geofence.name } : null,
      vehicle: e.vehicle ? { id: e.vehicle._id, number: e.vehicle.vehicleNumber } : null,
      location: { lng: e.location.coordinates[0], lat: e.location.coordinates[1] },
      speed: e.speed,
      createdAt: e.createdAt,
    })),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export default {
  getGeofences,
  getGeofenceById,
  createGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofenceEvents,
};
