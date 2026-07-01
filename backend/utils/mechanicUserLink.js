import Mechanic from '../models/Mechanic.js';
import User from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';
import { MECHANIC_STATUS } from '../constants/enums.js';

const defaultCertExpiry = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
};

const buildLegacyCertNumber = (userId) => `MECH-${userId.toString().slice(-8).toUpperCase()}`;

export const ensureMechanicProfileForUser = async (user, actorId = null) => {
  if (!user || user.role !== USER_ROLES.MECHANIC || user.isDeleted) return null;

  const existing = await Mechanic.findOne({
    isDeleted: false,
    $or: [{ user: user._id }, ...(user.email ? [{ email: user.email.toLowerCase() }] : [])],
  });

  if (existing) {
    if (!existing.user) {
      existing.user = user._id;
      await existing.save({ validateBeforeSave: false });
    }
    return existing;
  }

  return Mechanic.create({
    user: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email?.toLowerCase(),
    phone: user.phone || '',
    certificationNumber: buildLegacyCertNumber(user._id),
    certificationExpiry: defaultCertExpiry(),
    status: user.isActive ? MECHANIC_STATUS.AVAILABLE : MECHANIC_STATUS.UNAVAILABLE,
    notes: 'Imported from user account. Update certification details.',
    createdBy: actorId || user._id,
    updatedBy: actorId || user._id,
  });
};

export const syncMechanicProfilesFromUsers = async () => {
  const users = await User.find({ role: USER_ROLES.MECHANIC, isDeleted: false });

  for (const user of users) {
    await ensureMechanicProfileForUser(user);
  }
};

export const linkMechanicProfileToUser = async (mechanic) => {
  if (!mechanic?.email || mechanic.user) return mechanic;

  const user = await User.findOne({
    email: mechanic.email.toLowerCase(),
    role: USER_ROLES.MECHANIC,
    isDeleted: false,
  });

  if (user) {
    mechanic.user = user._id;
    await mechanic.save({ validateBeforeSave: false });
  }

  return mechanic;
};

export const linkUserToMechanicProfile = async (user) => {
  if (user?.role !== USER_ROLES.MECHANIC) return;
  await ensureMechanicProfileForUser(user);
};

export const getMechanicIdForUser = async (userId) => {
  const linked = await Mechanic.findOne({ user: userId, isDeleted: false }).select('_id');
  if (linked) return linked._id;

  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user || user.role !== USER_ROLES.MECHANIC) return null;

  const profile = await ensureMechanicProfileForUser(user);
  return profile?._id || null;
};

export const getUserIdForMechanic = async (mechanicId) => {
  if (!mechanicId) return null;

  const mechanic = await Mechanic.findOne({ _id: mechanicId, isDeleted: false }).select('user email');
  if (!mechanic) return null;

  if (mechanic.user) return mechanic.user;

  if (mechanic.email) {
    const user = await User.findOne({
      email: mechanic.email.toLowerCase(),
      role: USER_ROLES.MECHANIC,
      isDeleted: false,
    }).select('_id');

    if (user) {
      mechanic.user = user._id;
      await mechanic.save({ validateBeforeSave: false });
      return user._id;
    }
  }

  return null;
};

export default {
  ensureMechanicProfileForUser,
  syncMechanicProfilesFromUsers,
  linkMechanicProfileToUser,
  linkUserToMechanicProfile,
  getMechanicIdForUser,
  getUserIdForMechanic,
};
