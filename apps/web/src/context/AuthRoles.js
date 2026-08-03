export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  EDITOR: 'editor',
  SUPPORT: 'support',
};

export function hasRole(user, roles = []) {
  if (!user?.roles?.length) return false;
  const needed = Array.isArray(roles) ? roles : [roles];
  return needed.some((role) => user.roles.includes(role));
}

export function isBuyer(user) {
  return hasRole(user, [ROLES.BUYER, ROLES.SELLER]);
}

export function isSeller(user) {
  return hasRole(user, ROLES.SELLER);
}

export function isAdmin(user) {
  return hasRole(user, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
}

export function isSuperAdmin(user) {
  return hasRole(user, ROLES.SUPER_ADMIN);
}

export function defaultHomeForUser(user) {
  if (isAdmin(user)) return '/admin';
  if (isSeller(user)) return '/seller/dashboard';
  return '/dashboard';
}

export default {
  ROLES,
  hasRole,
  isBuyer,
  isSeller,
  isAdmin,
  isSuperAdmin,
  defaultHomeForUser,
};
