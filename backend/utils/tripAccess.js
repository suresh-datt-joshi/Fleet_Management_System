import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import AppError from '../utils/AppError.js';
import { USER_ROLES } from '../constants/roles.js';
import { getDriverIdForUser } from './driverUserLink.js';

export { getDriverIdForUser };

export const isDriverRole = (user) => user?.role === USER_ROLES.DRIVER;

export const assertTripDriverAccess = async (trip, user) => {
  if (!isDriverRole(user)) return;

  const driverId = await getDriverIdForUser(user._id);
  if (!driverId) {
    throw new AppError('No driver profile linked to your account', 403);
  }

  const tripDriverId = trip.driver?._id?.toString() || trip.driver?.toString();
  if (tripDriverId !== driverId.toString()) {
    throw new AppError('Not authorized to access this trip', 403);
  }
};

export const applyDriverTripScope = async (filter, user) => {
  if (!isDriverRole(user)) return filter;

  const driverId = await getDriverIdForUser(user._id);
  if (!driverId) {
    filter.driver = null;
    return filter;
  }

  filter.driver = driverId;
  return filter;
};

export const getTripForAccessCheck = async (tripId) => {
  const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);
  return trip;
};

export const assertCanReviewTrip = (user) => {
  if (isDriverRole(user)) {
    throw new AppError('Drivers cannot review trips', 403);
  }
};

export default {
  getDriverIdForUser,
  isDriverRole,
  assertTripDriverAccess,
  assertCanReviewTrip,
  applyDriverTripScope,
  getTripForAccessCheck,
};
