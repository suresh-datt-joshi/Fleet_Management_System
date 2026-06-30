import Driver from '../models/Driver.js';
import User from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';

export const linkDriverProfileToUser = async (driver) => {
  if (!driver?.email || driver.user) return driver;

  const user = await User.findOne({
    email: driver.email.toLowerCase(),
    role: USER_ROLES.DRIVER,
    isDeleted: false,
  });

  if (user) {
    driver.user = user._id;
    await driver.save({ validateBeforeSave: false });
  }

  return driver;
};

export const linkUserToDriverProfile = async (user) => {
  if (!user?.email || user.role !== USER_ROLES.DRIVER) return;

  const driver = await Driver.findOne({
    email: user.email.toLowerCase(),
    isDeleted: false,
  });

  if (driver && !driver.user) {
    driver.user = user._id;
    await driver.save({ validateBeforeSave: false });
  }
};

export const getDriverIdForUser = async (userId) => {
  const linked = await Driver.findOne({ user: userId, isDeleted: false }).select('_id');
  if (linked) return linked._id;

  const user = await User.findOne({ _id: userId, isDeleted: false }).select('email role');
  if (!user?.email || user.role !== USER_ROLES.DRIVER) return null;

  const byEmail = await Driver.findOne({ email: user.email.toLowerCase(), isDeleted: false });
  if (!byEmail) return null;

  if (!byEmail.user) {
    byEmail.user = userId;
    await byEmail.save({ validateBeforeSave: false });
  }

  return byEmail._id;
};

export const getUserIdForDriver = async (driverId) => {
  if (!driverId) return null;

  const driver = await Driver.findOne({ _id: driverId, isDeleted: false }).select('user email');
  if (!driver) return null;

  if (driver.user) return driver.user;

  if (driver.email) {
    const user = await User.findOne({
      email: driver.email.toLowerCase(),
      role: USER_ROLES.DRIVER,
      isDeleted: false,
    }).select('_id');

    if (user) {
      driver.user = user._id;
      await driver.save({ validateBeforeSave: false });
      return user._id;
    }
  }

  return null;
};

export default { linkDriverProfileToUser, linkUserToDriverProfile, getDriverIdForUser, getUserIdForDriver };
