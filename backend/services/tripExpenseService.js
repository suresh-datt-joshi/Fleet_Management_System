import TripExpense from '../models/TripExpense.js';
import Trip from '../models/Trip.js';
import TripHistory from '../models/TripHistory.js';
import AppError from '../utils/AppError.js';
import { uploadFile } from './cloudinaryService.js';
import { TRIP_STATUS, TRIP_HISTORY_ACTIONS, TRIP_EXPENSE_CATEGORIES } from '../constants/enums.js';
import { assertTripDriverAccess, getTripForAccessCheck } from '../utils/tripAccess.js';
import * as fuelService from './fuelService.js';

const formatExpense = (expense) => {
  const e = expense.toObject ? expense.toObject() : expense;
  return {
    id: e._id,
    tripId: e.trip,
    category: e.category,
    amount: e.amount,
    description: e.description,
    vendor: e.vendor,
    fuelQuantity: e.fuelQuantity,
    receiptUrl: e.receiptUrl,
    receiptFileName: e.receiptFileName,
    receiptMimeType: e.receiptMimeType,
    loggedAt: e.loggedAt,
    createdAt: e.createdAt,
  };
};

export const recalculateTripTotals = async (tripId) => {
  const expenses = await TripExpense.find({ trip: tripId, isDeleted: false }).lean();

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalFuel = expenses
    .filter((e) => e.category === TRIP_EXPENSE_CATEGORIES.FUEL)
    .reduce((sum, e) => sum + (e.fuelQuantity || 0), 0);

  await Trip.updateOne(
    { _id: tripId },
    {
      expenses: Math.round(totalExpenses * 100) / 100,
      fuelUsed: Math.round(totalFuel * 100) / 100,
    }
  );

  return { totalExpenses, totalFuel };
};

export const getTripExpenses = async (tripId, user) => {
  const trip = await getTripForAccessCheck(tripId);
  await assertTripDriverAccess(trip, user);

  const expenses = await TripExpense.find({ trip: tripId, isDeleted: false })
    .sort({ loggedAt: -1 })
    .lean();

  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    expenses: expenses.map(formatExpense),
    summary: {
      total: Math.round(total * 100) / 100,
      count: expenses.length,
      byCategory: Object.values(TRIP_EXPENSE_CATEGORIES).reduce((acc, cat) => {
        acc[cat] = Math.round(
          expenses.filter((e) => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0) * 100
        ) / 100;
        return acc;
      }, {}),
    },
  };
};

export const addTripExpense = async (tripId, data, file, userId, user) => {
  const trip = await getTripForAccessCheck(tripId);
  await assertTripDriverAccess(trip, user);

  if (trip.status !== TRIP_STATUS.IN_PROGRESS) {
    throw new AppError('Expenses can only be logged while trip is in progress', 400);
  }

  if (data.category === TRIP_EXPENSE_CATEGORIES.FUEL) {
    const quantity = Number(data.fuelQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError('Fuel quantity is required for fuel expenses', 400);
    }
  }

  let receiptUrl = null;
  let receiptPublicId = null;
  let receiptFileName = null;
  let receiptMimeType = null;

  if (file) {
    const uploaded = await uploadFile(file.buffer, file.originalname, file.mimetype, 'trip-receipts');
    receiptUrl = uploaded.url;
    receiptPublicId = uploaded.publicId;
    receiptFileName = file.originalname;
    receiptMimeType = file.mimetype;
  }

  const expense = await TripExpense.create({
    trip: tripId,
    driver: trip.driver,
    vehicle: trip.vehicle,
    category: data.category,
    amount: data.amount,
    description: data.notes || data.description || '',
    vendor: data.fuelStation || data.vendor || '',
    fuelQuantity: data.fuelQuantity ?? null,
    receiptUrl,
    receiptPublicId,
    receiptFileName,
    receiptMimeType,
    loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
    createdBy: userId,
    updatedBy: userId,
  });

  if (data.category === TRIP_EXPENSE_CATEGORIES.FUEL) {
    try {
      await fuelService.createFuelLog(
        {
          vehicleId: trip.vehicle,
          driverId: trip.driver,
          tripId,
          tripExpenseId: expense._id,
          quantity: Number(data.fuelQuantity),
          cost: Number(data.amount),
          stationId: data.stationId || null,
          fuelStation: data.fuelStation || data.vendor || '',
          odometer: Number(data.odometer || 0),
          fuelType: data.fuelType,
          receiptNumber: data.receiptNumber || '',
          isFullTank: data.isFullTank !== false && data.isFullTank !== 'false',
          notes: data.notes || data.description || '',
          loggedAt: data.loggedAt || expense.loggedAt,
        },
        userId
      );
    } catch (error) {
      await TripExpense.deleteOne({ _id: expense._id });
      throw error;
    }
  }

  await recalculateTripTotals(tripId);

  const categoryLabel = data.category.replace('_', ' ');
  await TripHistory.create({
    trip: tripId,
    action: TRIP_HISTORY_ACTIONS.EXPENSE_ADDED,
    description: `${categoryLabel} expense of $${data.amount} logged`,
    performedBy: userId,
    changes: { category: data.category, amount: data.amount },
  });

  return formatExpense(expense);
};

export const updateConsignment = async (tripId, data, userId, user) => {
  const trip = await getTripForAccessCheck(tripId);
  await assertTripDriverAccess(trip, user);

  if (trip.status !== TRIP_STATUS.IN_PROGRESS) {
    throw new AppError('Consignment can only be updated while trip is in progress', 400);
  }

  if (!trip.consignment) trip.consignment = {};

  if (data.referenceNumber !== undefined) trip.consignment.referenceNumber = data.referenceNumber;
  if (data.description !== undefined) trip.consignment.description = data.description;
  if (data.status !== undefined) trip.consignment.status = data.status;
  if (data.notes !== undefined) trip.consignment.notes = data.notes;
  trip.consignment.updatedAt = new Date();
  trip.updatedBy = userId;

  await trip.save();

  await TripHistory.create({
    trip: tripId,
    action: TRIP_HISTORY_ACTIONS.CONSIGNMENT_UPDATED,
    description: `Consignment status updated to ${data.status || trip.consignment.status}`,
    performedBy: userId,
    changes: data,
  });

  return {
    referenceNumber: trip.consignment.referenceNumber || '',
    description: trip.consignment.description || '',
    status: trip.consignment.status,
    notes: trip.consignment.notes || '',
    updatedAt: trip.consignment.updatedAt,
  };
};

export default {
  getTripExpenses,
  addTripExpense,
  updateConsignment,
  recalculateTripTotals,
};
