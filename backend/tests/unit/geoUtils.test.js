import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance, isPointInCircle, isPointInGeofence } from '../../utils/geoUtils.js';

test('haversineDistance returns expected range for NYC coordinates', () => {
  const distance = haversineDistance(-74.006, 40.7128, -73.9857, 40.7484);
  assert.ok(distance > 4000 && distance < 6000);
});

test('isPointInCircle detects center and distant points', () => {
  assert.equal(isPointInCircle(-74.006, 40.7128, -74.006, 40.7128, 500), true);
  assert.equal(isPointInCircle(-74.1, 40.7128, -74.006, 40.7128, 500), false);
});

test('isPointInGeofence supports circle geofences', () => {
  const geofence = {
    type: 'circle',
    center: { coordinates: [-74.006, 40.7128] },
    radius: 1000,
  };

  assert.equal(isPointInGeofence(-74.006, 40.7128, geofence), true);
  assert.equal(isPointInGeofence(-75, 40.7128, geofence), false);
});
