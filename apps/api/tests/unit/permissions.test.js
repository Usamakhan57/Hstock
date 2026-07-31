import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePermissions,
  PERMISSIONS,
} from '../../src/constants/permissions.js';
import { USER_ROLES } from '../../src/constants/roles.js';

test('super_admin receives all permissions', () => {
  const permissions = resolvePermissions([USER_ROLES.SUPER_ADMIN]);
  assert.ok(permissions.includes(PERMISSIONS.CONFIG_WRITE));
  assert.ok(permissions.includes(PERMISSIONS.USERS_MANAGE));
  assert.ok(permissions.includes(PERMISSIONS.PRODUCTS_MODERATE));
});

test('buyer cannot write config', () => {
  const permissions = resolvePermissions([USER_ROLES.BUYER]);
  assert.equal(permissions.includes(PERMISSIONS.CONFIG_WRITE), false);
  assert.ok(permissions.includes(PERMISSIONS.PRODUCTS_READ));
});

test('seller can write products', () => {
  const permissions = resolvePermissions([USER_ROLES.SELLER]);
  assert.ok(permissions.includes(PERMISSIONS.PRODUCTS_WRITE));
  assert.equal(permissions.includes(PERMISSIONS.PRODUCTS_MODERATE), false);
});
