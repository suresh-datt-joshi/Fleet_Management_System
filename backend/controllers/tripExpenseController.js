import catchAsync from '../utils/catchAsync.js';
import * as tripExpenseService from '../services/tripExpenseService.js';

export const getExpenses = catchAsync(async (req, res) => {
  const result = await tripExpenseService.getTripExpenses(req.params.id, req.user);
  res.status(200).json({ success: true, data: result });
});

export const addExpense = catchAsync(async (req, res) => {
  const expense = await tripExpenseService.addTripExpense(
    req.params.id,
    req.body,
    req.file,
    req.user._id,
    req.user
  );
  res.status(201).json({ success: true, message: 'Expense logged', data: { expense } });
});

export const updateConsignment = catchAsync(async (req, res) => {
  const consignment = await tripExpenseService.updateConsignment(
    req.params.id,
    req.body,
    req.user._id,
    req.user
  );
  res.status(200).json({ success: true, message: 'Consignment updated', data: { consignment } });
});

export default { getExpenses, addExpense, updateConsignment };
