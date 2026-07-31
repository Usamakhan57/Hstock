import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/authApi';
import { usersApi } from '../services/usersApi';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  persistSession,
  getRememberMe,
} from '../lib/tokenStorage';
import { hydrateCatalog, getCatalogVersion } from '../services/catalogCache';

const StoreContext = createContext(null);

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const genId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const nowIso = () => new Date().toISOString();

function toStoreUser(user) {
  if (!user) return null;
  return {
    id: user.id || user._id,
    email: user.email,
    name: user.name,
    roles: user.roles || [],
    permissions: user.permissions || [],
    avatar: user.avatar || null,
    phone: user.phone || '',
    country: user.country || '',
    timezone: user.timezone || '',
    emailVerified: !!user.emailVerified,
    status: user.status,
  };
}

export const StoreProvider = ({ children }) => {
  const [user, setUser] = useState(() => toStoreUser(getStoredUser()));
  const [authReady, setAuthReady] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [profiles, setProfiles] = useState(null);
  const [compareList, setCompareList] = useState(() => load('hs_compare', []));
  const [notifications, setNotifications] = useState(() => load('hs_notifications', []));

  useEffect(() => { localStorage.setItem('hs_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('hs_compare', JSON.stringify(compareList)); }, [compareList]);

  // Clear legacy mock commerce keys from earlier phases.
  useEffect(() => {
    try {
      localStorage.removeItem('hs_wallet');
      localStorage.removeItem('hs_transactions');
      localStorage.removeItem('hs_orders');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await hydrateCatalog().catch(() => null);
        if (!cancelled) {
          setCatalogReady(true);
          setCatalogVersion(getCatalogVersion());
        }
        if (getAccessToken()) {
          const me = await authApi.me();
          if (!cancelled) {
            const nextUser = toStoreUser(me.user);
            setUser(nextUser);
            setProfiles(me.profiles || null);
            persistSession({
              accessToken: getAccessToken(),
              refreshToken: undefined,
              user: me.user,
              remember: getRememberMe(),
            });
          }
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setProfiles(null);
        }
      } finally {
        if (!cancelled) {
          setCatalogReady(true);
          setCatalogVersion(getCatalogVersion());
          setAuthReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const MAX_COMPARE = 4;

  const pushNotification = useCallback((type, title, body, link = null) => {
    setNotifications((prev) => [
      { id: genId('NTF'), type, title, body, link, date: nowIso(), read: false },
      ...prev,
    ].slice(0, 50));
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const inCompare = useCallback((id) => compareList.some((p) => p.id === id), [compareList]);

  const toggleCompare = useCallback((product) => {
    setCompareList((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((id) => setCompareList((prev) => prev.filter((p) => p.id !== id)), []);
  const clearCompare = useCallback(() => setCompareList([]), []);

  const applyAuthResult = useCallback((data) => {
    const nextUser = toStoreUser(data.user);
    setUser(nextUser);
    setProfiles(data.profiles || null);
    return nextUser;
  }, []);

  const login = useCallback(async (email, password, { remember = true } = {}) => {
    const data = await authApi.login({ email, password }, { remember });
    return applyAuthResult(data);
  }, [applyAuthResult]);

  const register = useCallback(async (payload, { remember = true } = {}) => {
    const data = await authApi.register(payload, { remember });
    return applyAuthResult(data);
  }, [applyAuthResult]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setProfiles(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const me = await usersApi.me();
    const nextUser = toStoreUser(me.user);
    setUser(nextUser);
    setProfiles(me.profiles || null);
    persistSession({
      accessToken: getAccessToken(),
      refreshToken: undefined,
      user: me.user,
      remember: getRememberMe(),
    });
    return me;
  }, []);

  const setUserLocal = useCallback((next) => {
    setUser(toStoreUser(next));
  }, []);

  return (
    <StoreContext.Provider value={{
      user,
      profiles,
      authReady,
      catalogReady,
      catalogVersion,
      login,
      register,
      logout,
      refreshProfile,
      setUserLocal,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,
      compareList,
      inCompare,
      toggleCompare,
      removeFromCompare,
      clearCompare,
      MAX_COMPARE,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
