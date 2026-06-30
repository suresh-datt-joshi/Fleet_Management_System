import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSIONS, ROLE_PERMISSIONS, USER_ROLES } from '../../constants/roles.js';

test('every role has a permissions array', () => {
  Object.values(USER_ROLES).forEach((role) => {
    assert.ok(Array.isArray(ROLE_PERMISSIONS[role]), `Missing permissions for ${role}`);
  });
});

test('permission values are unique', () => {
  const values = Object.values(PERMISSIONS);
  assert.equal(new Set(values).size, values.length);
});

test('super admin includes all permissions', () => {
  const superPerms = ROLE_PERMISSIONS[USER_ROLES.SUPER_ADMIN];
  Object.values(PERMISSIONS).forEach((permission) => {
    assert.ok(superPerms.includes(permission), `Super admin missing ${permission}`);
  });
});

test('driver role has limited trip access without tracking', () => {
  const driverPerms = ROLE_PERMISSIONS[USER_ROLES.DRIVER];
  assert.ok(driverPerms.includes(PERMISSIONS.VIEW_TRIPS));
  assert.equal(driverPerms.includes(PERMISSIONS.VIEW_TRACKING), false);
  assert.equal(driverPerms.includes(PERMISSIONS.MANAGE_USERS), false);
});
