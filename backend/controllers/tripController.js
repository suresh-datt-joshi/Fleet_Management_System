import catchAsync from '../utils/catchAsync.js';
import * as tripService from '../services/tripService.js';

export const getTrips = catchAsync(async (req, res) => {
  const result = await tripService.getTrips(req.query, req.user);
  res.status(200).json({ success: true, data: result });
});

export const getTripStats = catchAsync(async (req, res) => {
  const stats = await tripService.getTripStats();
  res.status(200).json({ success: true, data: stats });
});

export const getUpcomingTrips = catchAsync(async (req, res) => {
  const trips = await tripService.getUpcomingTrips(req.query);
  res.status(200).json({ success: true, data: trips });
});

export const getTripAnalytics = catchAsync(async (req, res) => {
  const analytics = await tripService.getTripAnalytics(req.query);
  res.status(200).json({ success: true, data: analytics });
});

export const getMetaDrivers = catchAsync(async (req, res) => {
  const drivers = await tripService.getMetaDrivers();
  res.status(200).json({ success: true, data: drivers });
});

export const getMetaVehicles = catchAsync(async (req, res) => {
  const vehicles = await tripService.getMetaVehicles();
  res.status(200).json({ success: true, data: vehicles });
});

export const getMetaRoutes = catchAsync(async (req, res) => {
  const routes = await tripService.getMetaRoutes();
  res.status(200).json({ success: true, data: routes });
});

export const getMetaFuelStations = catchAsync(async (req, res) => {
  const stations = await tripService.getMetaFuelStations();
  res.status(200).json({ success: true, data: stations });
});

export const getTrip = catchAsync(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id, req.user);
  res.status(200).json({ success: true, data: { trip } });
});

export const getMyDriverProfile = catchAsync(async (req, res) => {
  const driver = await tripService.getMyDriverProfile(req.user._id);
  res.status(200).json({ success: true, data: { driver } });
});

export const getMyActiveTrip = catchAsync(async (req, res) => {
  const trip = await tripService.getMyActiveTrip(req.user._id);
  res.status(200).json({ success: true, data: { trip } });
});

export const getMyScheduledTrips = catchAsync(async (req, res) => {
  const trips = await tripService.getMyScheduledTrips(req.user._id);
  res.status(200).json({ success: true, data: trips });
});

export const createTrip = catchAsync(async (req, res) => {
  const trip = await tripService.createTrip(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Trip created successfully', data: { trip } });
});

export const updateTrip = catchAsync(async (req, res) => {
  const trip = await tripService.updateTrip(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Trip updated successfully', data: { trip } });
});

export const deleteTrip = catchAsync(async (req, res) => {
  const result = await tripService.deleteTrip(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const startTrip = catchAsync(async (req, res) => {
  const trip = await tripService.startTrip(req.params.id, req.user._id, req.user);
  res.status(200).json({ success: true, message: 'Trip started', data: { trip } });
});

export const completeTrip = catchAsync(async (req, res) => {
  const trip = await tripService.completeTrip(req.params.id, req.body, req.user._id, req.user);
  res.status(200).json({
    success: true,
    message: 'Trip submitted for dispatcher review',
    data: { trip },
  });
});

export const reviewTrip = catchAsync(async (req, res) => {
  const trip = await tripService.reviewTrip(req.params.id, req.body, req.user._id, req.user);
  res.status(200).json({ success: true, message: 'Trip reviewed and closed', data: { trip } });
});

export const getPendingReviewTrips = catchAsync(async (req, res) => {
  const result = await tripService.getPendingReviewTrips(req.query);
  res.status(200).json({ success: true, data: result });
});

export const cancelTrip = catchAsync(async (req, res) => {
  const trip = await tripService.cancelTrip(req.params.id, req.body, req.user._id, req.user);
  res.status(200).json({ success: true, message: 'Trip cancelled', data: { trip } });
});

export const getHistory = catchAsync(async (req, res) => {
  const result = await tripService.getTripHistory(req.params.id, req.query);
  res.status(200).json({ success: true, data: result });
});

export const exportCSV = catchAsync(async (req, res) => {
  const csv = await tripService.exportTripsCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=trips-${Date.now()}.csv`);
  res.status(200).send(csv);
});
