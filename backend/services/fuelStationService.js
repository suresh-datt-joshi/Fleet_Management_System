import FuelLog from '../models/FuelLog.js';
import FuelStation from '../models/FuelStation.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { FUEL_STATION_STATUS, ACTIVITY_TYPES } from '../constants/enums.js';

const vehiclePopulate = { path: 'vehicle', select: 'vehicleNumber model manufacturer fuelType odometer' };
const driverPopulate = { path: 'driver', select: 'firstName lastName employeeId' };
const stationPopulate = { path: 'station', select: 'name brand city address' };

const formatStation = (s) => {
  const doc = s.toObject ? s.toObject() : s;
  return {
    id: doc._id,
    name: doc.name,
    brand: doc.brand,
    address: doc.address,
    city: doc.city,
    state: doc.state,
    zipCode: doc.zipCode,
    phone: doc.phone,
    location: doc.location?.coordinates
      ? { lng: doc.location.coordinates[0], lat: doc.location.coordinates[1] }
      : null,
    fuelTypes: doc.fuelTypes || [],
    status: doc.status,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const buildStationFilter = (query) => {
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.fuelType) filter.fuelTypes = query.fuelType;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { brand: regex }, { city: regex }, { address: regex }];
  }
  return filter;
};

export const getFuelStations = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildStationFilter(query);

  const [stations, total] = await Promise.all([
    FuelStation.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    FuelStation.countDocuments(filter),
  ]);

  return {
    stations: stations.map(formatStation),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getFuelStationById = async (id) => {
  const station = await FuelStation.findOne({ _id: id, isDeleted: false }).lean();
  if (!station) throw new AppError('Fuel station not found', 404);
  return formatStation(station);
};

export const createFuelStation = async (data, userId) => {
  const payload = {
    ...data,
    createdBy: userId,
    updatedBy: userId,
  };

  if (data.location) {
    payload.location = {
      type: 'Point',
      coordinates: [data.location.lng, data.location.lat],
    };
  }

  const station = await FuelStation.create(payload);
  return formatStation(station);
};

export const updateFuelStation = async (id, data, userId) => {
  const station = await FuelStation.findOne({ _id: id, isDeleted: false });
  if (!station) throw new AppError('Fuel station not found', 404);

  if (data.location) {
    station.location = { type: 'Point', coordinates: [data.location.lng, data.location.lat] };
    delete data.location;
  }

  Object.assign(station, data, { updatedBy: userId });
  await station.save();
  return formatStation(station);
};

export const deleteFuelStation = async (id, userId) => {
  const station = await FuelStation.findOne({ _id: id, isDeleted: false });
  if (!station) throw new AppError('Fuel station not found', 404);

  const linkedLogs = await FuelLog.countDocuments({ station: id, isDeleted: false });
  if (linkedLogs > 0) {
    throw new AppError('Cannot delete station with linked fuel logs', 400);
  }

  station.isDeleted = true;
  station.deletedAt = new Date();
  station.status = FUEL_STATION_STATUS.INACTIVE;
  station.updatedBy = userId;
  await station.save();

  return { message: 'Fuel station deleted successfully' };
};

export const getActiveStationsList = async () => {
  const stations = await FuelStation.find({
    isDeleted: false,
    status: FUEL_STATION_STATUS.ACTIVE,
  })
    .select('name brand city fuelTypes')
    .sort({ name: 1 })
    .lean();

  return stations.map((s) => ({
    id: s._id,
    name: s.name,
    brand: s.brand,
    city: s.city,
    fuelTypes: s.fuelTypes,
  }));
};

export default {
  getFuelStations,
  getFuelStationById,
  createFuelStation,
  updateFuelStation,
  deleteFuelStation,
  getActiveStationsList,
};
