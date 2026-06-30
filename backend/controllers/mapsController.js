import catchAsync from '../utils/catchAsync.js';
import * as mapsService from '../services/mapsService.js';

export const getConfig = catchAsync(async (req, res) => {
  const config = mapsService.getMapsConfig();
  res.status(200).json({ success: true, data: config });
});

export const getBrowserConfig = catchAsync(async (req, res) => {
  const config = mapsService.getBrowserConfig();
  res.status(200).json({ success: true, data: config });
});

export const geocode = catchAsync(async (req, res) => {
  const result = await mapsService.geocodeAddress(req.body.address);
  res.status(200).json({ success: true, data: result });
});

export const reverseGeocode = catchAsync(async (req, res) => {
  const result = await mapsService.reverseGeocodeLocation(req.body.lat, req.body.lng);
  res.status(200).json({ success: true, data: result });
});

export const getDirections = catchAsync(async (req, res) => {
  const result = await mapsService.getDirections(req.body);
  res.status(200).json({ success: true, data: result });
});

export const getDistanceMatrix = catchAsync(async (req, res) => {
  const result = await mapsService.getDistanceMatrix(req.body);
  res.status(200).json({ success: true, data: result });
});

export const getStaticMap = catchAsync(async (req, res) => {
  const markers = req.query.markers
    ? req.query.markers.split(';').map((pair) => {
        const [lat, lng] = pair.split(',').map(Number);
        return { lat, lng };
      })
    : [{ lat: Number(req.query.lat), lng: Number(req.query.lng) }];

  const result = await mapsService.getStaticMapUrl({
    center: { lat: Number(req.query.lat), lng: Number(req.query.lng) },
    zoom: req.query.zoom ? Number(req.query.zoom) : undefined,
    width: req.query.width ? Number(req.query.width) : undefined,
    height: req.query.height ? Number(req.query.height) : undefined,
    markers,
  });

  res.status(200).json({ success: true, data: result });
});

export default {
  getConfig,
  getBrowserConfig,
  geocode,
  reverseGeocode,
  getDirections,
  getDistanceMatrix,
  getStaticMap,
};
