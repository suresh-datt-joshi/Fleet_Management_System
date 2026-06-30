import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePolyline, encodePolyline } from '../../utils/polylineUtils.js';

test('encodePolyline and decodePolyline roundtrip', () => {
  const points = [
    { lat: 40.7128, lng: -74.006 },
    { lat: 40.758, lng: -73.9855 },
    { lat: 40.6892, lng: -74.0445 },
  ];

  const encoded = encodePolyline(points);
  const decoded = decodePolyline(encoded);

  assert.equal(decoded.length, points.length);
  assert.ok(Math.abs(decoded[0].lat - points[0].lat) < 0.0001);
  assert.ok(Math.abs(decoded[0].lng - points[0].lng) < 0.0001);
});

test('decodePolyline returns empty array for empty input', () => {
  assert.deepEqual(decodePolyline(''), []);
  assert.deepEqual(decodePolyline(null), []);
});
