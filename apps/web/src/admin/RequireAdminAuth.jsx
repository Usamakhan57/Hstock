import React from 'react';
import RequireRole from '../components/RequireRole';
import { ROLES } from '../context/AuthRoles';

const RequireAdminAuth = ({ children }) => (
  <RequireRole roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} redirectTo="/admin/login">
    {children}
  </RequireRole>
);

export default RequireAdminAuth;
