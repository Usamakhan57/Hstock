import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { hasRole } from '../context/AuthRoles';

/**
 * Role-based route guard. Waits for auth bootstrap before redirecting.
 */
const RequireRole = ({ roles = [], children, redirectTo = '/login' }) => {
  const { user, authReady } = useStore();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (roles.length && !hasRole(user, roles)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default RequireRole;
