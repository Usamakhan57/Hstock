export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer',
  EDITOR: 'editor',
  SUPPORT: 'support',
});

export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));

export const STAFF_ROLES = Object.freeze([
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.EDITOR,
  USER_ROLES.SUPPORT,
]);

export const ADMIN_LOGIN_ROLES = Object.freeze([
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.EDITOR,
  USER_ROLES.SUPPORT,
]);

export default USER_ROLES;
