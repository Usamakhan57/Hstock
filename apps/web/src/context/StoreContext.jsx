import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/authApi';
import { usersApi } from '../services/usersApi';
import { notificationsApi } from '../services/notificationsApi';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  persistSession,
  getRememberMe,
} from '../lib/tokenStorage';
import { hydrateCatalog, getCatalogVersion } from '../services/catalogCache';
import useSocket from '../hooks/useSocket';

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

function mapNotification(n) {
  return {
    id: n.id || n._id,
    type: n.type || 'message',
    title: n.title || '',
    body: n.body || '',
    link: n.link || null,
    date: n.date || n.createdAt || nowIso(),
    read: !!n.read,
  };
}

export const StoreProvider = ({ children }) => {
  const [user, setUser] = useState(() => toStoreUser(getStoredUser()));
  const [authReady, setAuthReady] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [profiles, setProfiles] = useState(null);
  const [compareList, setCompareList] = useState(() => load('hs_compare', []));
  const [wishlist, setWishlist] = useState(() => load('apna_wishlist', load('hs_wishlist', [])));
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { localStorage.setItem('hs_compare', JSON.stringify(compareList)); }, [compareList]);
  useEffect(() => { localStorage.setItem('apna_wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.removeItem('hs_wallet');
      localStorage.removeItem('hs_transactions');
      localStorage.removeItem('hs_orders');
    } catch {
      // ignore
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getAccessToken()) {
      setNotifications([]);
      return;
    }
    try {
      const { items } = await notificationsApi.list({ limit: 50 });
      setNotifications(items.map(mapNotification));
    } catch {
      setNotifications([]);
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
              // Preserve refresh token — never wipe it during hydrate.
              user: me.user,
              remember: getRememberMe(),
            });
            await refreshNotifications();
          }
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setProfiles(null);
          setNotifications([]);
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
  }, [refreshNotifications]);

  const handleSocketNotification = useCallback((payload) => {
    const mapped = mapNotification(payload);
    setNotifications((prev) => {
      const without = prev.filter((n) => n.id !== mapped.id);
      return [mapped, ...without].slice(0, 50);
    });
  }, []);

  const handleSocketUnreadCount = useCallback(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useSocket({
    enabled: !!user && !!getAccessToken(),
    onNotification: handleSocketNotification,
    onUnreadCount: handleSocketUnreadCount,
  });

  const MAX_COMPARE = 4;

  const pushNotification = useCallback((type, title, body, link = null) => {
    setNotifications((prev) => [
      { id: genId('NTF'), type, title, body, link, date: nowIso(), read: false },
      ...prev,
    ].slice(0, 50));
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (getAccessToken()) {
      try {
        await notificationsApi.markRead(id);
      } catch {
        // ignore
      }
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (getAccessToken()) {
      try {
        await notificationsApi.markAllRead();
      } catch {
        // ignore
      }
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (getAccessToken()) {
      try {
        await notificationsApi.remove(id);
      } catch {
        // ignore
      }
    }
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

  const inWishlist = useCallback((id) => wishlist.some((p) => p.id === id), [wishlist]);

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((id) => setWishlist((prev) => prev.filter((p) => p.id !== id)), []);
  const clearWishlist = useCallback(() => setWishlist([]), []);

  const applyAuthResult = useCallback((data) => {
    const nextUser = toStoreUser(data.user);
    setUser(nextUser);
    setProfiles(data.profiles || null);
    return nextUser;
  }, []);

  const login = useCallback(async (email, password, { remember = true } = {}) => {
    const data = await authApi.login({ email, password }, { remember });
    const nextUser = applyAuthResult(data);
    await refreshNotifications();
    return nextUser;
  }, [applyAuthResult, refreshNotifications]);

  const register = useCallback(async (payload, { remember = true } = {}) => {
    const data = await authApi.register(payload, { remember });
    const nextUser = applyAuthResult(data);
    await refreshNotifications();
    return nextUser;
  }, [applyAuthResult, refreshNotifications]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setProfiles(null);
    setNotifications([]);
  }, []);

  const refreshProfile = useCallback(async () => {
    const me = await usersApi.me();
    const nextUser = toStoreUser(me.user);
    setUser(nextUser);
    setProfiles(me.profiles || null);
    persistSession({
      accessToken: getAccessToken(),
      // Keep existing refresh token so subsequent 401s can silent-refresh.
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
      deleteNotification,
      refreshNotifications,
      pushNotification,
      compareList,
      inCompare,
      toggleCompare,
      removeFromCompare,
      clearCompare,
      MAX_COMPARE,
      wishlist,
      inWishlist,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
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
