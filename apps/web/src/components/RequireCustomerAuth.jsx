import React from 'react';
import RequireRole from './RequireRole';
import { ROLES } from '../context/AuthRoles';

const RequireCustomerAuth = ({ children }) => (
  <RequireRole roles={[ROLES.BUYER, ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} redirectTo="/login">
    {children}
  </RequireRole>
);

export default RequireCustomerAuth;
