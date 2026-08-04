/**
 * RBAC permissions. Role → permission grants.
 * Super Admin inherits every permission.
 */

export const PERMISSIONS = Object.freeze({
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_MANAGE: 'users:manage',

  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_MODERATE: 'products:moderate',

  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',

  BRANDS_READ: 'brands:read',
  BRANDS_WRITE: 'brands:write',

  TAGS_READ: 'tags:read',
  TAGS_WRITE: 'tags:write',

  CONFIG_READ: 'config:read',
  CONFIG_WRITE: 'config:write',

  ACTIVITY_READ: 'activity:read',

  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  ORDERS_MANAGE: 'orders:manage',

  PAYMENTS_READ: 'payments:read',
  PAYMENTS_MANAGE: 'payments:manage',

  ESCROW_READ: 'escrow:read',
  ESCROW_MANAGE: 'escrow:manage',

  WALLET_READ: 'wallet:read',
  WALLET_MANAGE: 'wallet:manage',

  LEDGER_READ: 'ledger:read',
  LEDGER_MANAGE: 'ledger:manage',

  WITHDRAWALS_READ: 'withdrawals:read',
  WITHDRAWALS_WRITE: 'withdrawals:write',
  WITHDRAWALS_MANAGE: 'withdrawals:manage',

  DISPUTES_READ: 'disputes:read',
  DISPUTES_WRITE: 'disputes:write',
  DISPUTES_MANAGE: 'disputes:manage',

  REFUNDS_READ: 'refunds:read',
  REFUNDS_MANAGE: 'refunds:manage',
});

export const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));

const ALL = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = Object.freeze({
  buyer: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.BRANDS_READ,
    PERMISSIONS.TAGS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.DISPUTES_READ,
    PERMISSIONS.DISPUTES_WRITE,
  ],
  seller: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.BRANDS_READ,
    PERMISSIONS.TAGS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ESCROW_READ,
    PERMISSIONS.WALLET_READ,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.WITHDRAWALS_WRITE,
    PERMISSIONS.DISPUTES_READ,
    PERMISSIONS.DISPUTES_WRITE,
    PERMISSIONS.PAYMENTS_READ,
  ],
  editor: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.PRODUCTS_MODERATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_WRITE,
    PERMISSIONS.BRANDS_READ,
    PERMISSIONS.BRANDS_WRITE,
    PERMISSIONS.TAGS_READ,
    PERMISSIONS.TAGS_WRITE,
    PERMISSIONS.CONFIG_READ,
    PERMISSIONS.CONFIG_WRITE,
    PERMISSIONS.ORDERS_READ,
  ],
  support: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.BRANDS_READ,
    PERMISSIONS.TAGS_READ,
    PERMISSIONS.ACTIVITY_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.DISPUTES_READ,
    PERMISSIONS.DISPUTES_WRITE,
    PERMISSIONS.DISPUTES_MANAGE,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.ESCROW_READ,
  ],
  admin: ALL,
  super_admin: ALL,
});

export function resolvePermissions(roles = []) {
  const set = new Set();
  for (const role of roles) {
    const grants = ROLE_PERMISSIONS[role] || [];
    for (const permission of grants) {
      set.add(permission);
    }
  }
  return [...set];
}

export default {
  PERMISSIONS,
  PERMISSION_VALUES,
  ROLE_PERMISSIONS,
  resolvePermissions,
};
