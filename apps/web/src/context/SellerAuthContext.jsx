import React, { createContext, useContext, useMemo } from 'react';
import { useStore } from './StoreContext';
import { authApi } from '../services/authApi';
import { isSeller } from './AuthRoles';
import { getRememberMe, persistSession, getAccessToken } from '../lib/tokenStorage';

const SellerAuthContext = createContext(null);

function canAccessSellerPortal(user) {
  // Admins use the isolated Admin Panel — never the seller portal.
  return isSeller(user);
}

/**
 * Seller auth adapter — uses the shared JWT session from StoreContext / authApi.
 * Keeps the previous { ok, error } return shape for SellerLogin/Register pages.
 */
export const SellerAuthProvider = ({ children }) => {
  const { user, profiles, login, logout, refreshProfile, setUserLocal } = useStore();

  const seller = useMemo(() => {
    if (!user || !canAccessSellerPortal(user)) return null;
    const profile = profiles?.seller || null;
    return {
      id: profile?._id || profile?.id || user.id,
      storeName: profile?.storeName || user.name,
      name: user.name,
      email: user.email,
      slug: profile?.slug || profile?.storeSlug || null,
      joinedAt: profile?.createdAt || user.createdAt || null,
      status: profile?.status || 'pending',
      commissionRate: profile?.commissionRate ?? profile?.commission ?? 15,
      commission: profile?.commission ?? profile?.commissionRate ?? 15,
      approvedAt: profile?.approvedAt || null,
      approvedBy: profile?.approvedBy || null,
      verified: !!profile?.verified,
      sellerVerified: !!profile?.verified,
      verifiedAt: profile?.verifiedAt || null,
      bio: profile?.bio || '',
      phone: profile?.phone || user.phone || '',
      logo: profile?.logo || '',
      avatar: profile?.avatar || profile?.logo || '',
      banner: profile?.banner || '',
      storePromotionActive: !!profile?.storePromotionActive,
      storePromotedUntil: profile?.storePromotedUntil || null,
    };
  }, [user, profiles]);

  const refreshSeller = async () => refreshProfile().catch(() => null);

  const register = async ({ storeName, name, email, password }) => {
    try {
      const data = await authApi.sellerRegister({
        storeName,
        name: name || storeName,
        email,
        password,
      }, { remember: getRememberMe() });
      setUserLocal(data.user);
      await refreshProfile().catch(() => null);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || 'Registration failed.' };
    }
  };

  const sellerLogin = async (email, password) => {
    try {
      const data = await authApi.sellerLogin({ email, password }, { remember: true });
      persistSession({
        accessToken: data.accessToken || getAccessToken(),
        refreshToken: data.refreshToken,
        user: data.user,
        remember: true,
      });
      setUserLocal(data.user);
      await refreshProfile().catch(() => null);
      return { ok: true };
    } catch (error) {
      // Fallback: buyer login that also has seller role
      try {
        await login(email, password, { remember: true });
        const me = await refreshProfile();
        if (!canAccessSellerPortal(me?.user)) {
          await logout();
          return { ok: false, error: 'This account is not a seller account.' };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: error.message || 'Invalid email or password.' };
      }
    }
  };

  const value = {
    seller,
    isAuthenticated: !!seller,
    register,
    login: sellerLogin,
    logout,
    refreshSeller,
  };

  return (
    <SellerAuthContext.Provider value={value}>
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) throw new Error('useSellerAuth must be used within SellerAuthProvider');
  return ctx;
};
