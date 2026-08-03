import React from 'react';
import RequireRole from './RequireRole';
import { ROLES } from '../context/AuthRoles';

/** Seller portal routes — admins are redirected to /admin by RequireRole. */
const RequireSellerAuth = ({ children }) => (
  <RequireRole roles={[ROLES.SELLER]} redirectTo="/seller/login">
    {children}
  </RequireRole>
);

export default RequireSellerAuth;
