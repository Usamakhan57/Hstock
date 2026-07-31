import React from 'react';
import RequireRole from './RequireRole';
import { ROLES } from '../context/AuthRoles';

const RequireSellerAuth = ({ children }) => (
  <RequireRole roles={[ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} redirectTo="/seller/login">
    {children}
  </RequireRole>
);

export default RequireSellerAuth;
