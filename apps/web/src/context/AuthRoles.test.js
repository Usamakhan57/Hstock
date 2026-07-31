import { describe, expect, it } from 'vitest';
import {
  ROLES,
  hasRole,
  isAdmin,
  isBuyer,
  isSeller,
  isSuperAdmin,
  defaultHomeForUser,
} from './AuthRoles';

describe('AuthRoles', () => {
  it('detects buyer/seller/admin/super admin roles', () => {
    const buyer = { roles: [ROLES.BUYER] };
    const seller = { roles: [ROLES.SELLER] };
    const admin = { roles: [ROLES.ADMIN] };
    const superAdmin = { roles: [ROLES.SUPER_ADMIN] };

    expect(isBuyer(buyer)).toBe(true);
    expect(isSeller(seller)).toBe(true);
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(superAdmin)).toBe(true);
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(hasRole(seller, [ROLES.SELLER, ROLES.ADMIN])).toBe(true);
  });

  it('routes users to the correct default home', () => {
    expect(defaultHomeForUser({ roles: [ROLES.ADMIN] })).toBe('/admin');
    expect(defaultHomeForUser({ roles: [ROLES.SELLER] })).toBe('/seller/dashboard');
    expect(defaultHomeForUser({ roles: [ROLES.BUYER] })).toBe('/');
  });
});
