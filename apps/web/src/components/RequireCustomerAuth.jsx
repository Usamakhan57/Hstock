import React from 'react';
import RequireRole from './RequireRole';
import { ROLES } from '../context/AuthRoles';

/** Buyer account routes — admins are redirected to /admin by RequireRole. */
const RequireCustomerAuth = ({ children }) => (
  <RequireRole roles={[ROLES.BUYER, ROLES.SELLER]} redirectTo="/login">
    {children}
  </RequireRole>
);

export default RequireCustomerAuth;
