import React, { createContext, useContext, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { authApi } from '../services/authApi';
import { isAdmin } from '../context/AuthRoles';
import { persistSession, getAccessToken } from '../lib/tokenStorage';

const AdminAuthContext = createContext(null);

/**
 * Admin auth adapter — real `/auth/admin/login`.
 * Admin dashboard CRUD remains out of Phase 4.1 scope.
 */
export const AdminAuthProvider = ({ children }) => {
  const { user, logout, setUserLocal, refreshProfile } = useStore();

  const admin = useMemo(() => {
    if (!user || !isAdmin(user)) return null;
    return {
      email: user.email,
      name: user.name,
      roles: user.roles,
      id: user.id,
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const data = await authApi.adminLogin({ email, password }, { remember: true });
      persistSession({
        accessToken: data.accessToken || getAccessToken(),
        refreshToken: data.refreshToken,
        user: data.user,
        remember: true,
      });
      setUserLocal(data.user);
      await refreshProfile().catch(() => null);
      if (!isAdmin(data.user)) {
        await logout();
        return { ok: false, error: 'Admin access required.' };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || 'Invalid email or password.' };
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
