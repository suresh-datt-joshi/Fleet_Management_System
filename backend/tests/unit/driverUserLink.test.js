import test from 'node:test';
import assert from 'node:assert/strict';
import { getDriverIdForUser, linkUserToDriverProfile, linkDriverProfileToUser } from '../../utils/driverUserLink.js';

test('driverUserLink exports resolve functions', () => {
  assert.equal(typeof getDriverIdForUser, 'function');
  assert.equal(typeof linkUserToDriverProfile, 'function');
  assert.equal(typeof linkDriverProfileToUser, 'function');
});
