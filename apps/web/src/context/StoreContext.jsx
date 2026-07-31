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

// Wallet/orders remain local placeholders until later commerce frontend phases.
const STARTING_WALLET_BALANCE = 0;

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
  const [wallet, setWallet] = useState(() => load('hs_wallet', STARTING_WALLET_BALANCE));
  const [transactions, setTransactions] = useState(() => load('hs_transactions', []));
  const [orders, setOrders] = useState(() => load('hs_orders', []));
  const [compareList, setCompareList] = useState(() => load('hs_compare', []));
  const [notifications, setNotifications] = useState(() => load('hs_notifications', []));

  useEffect(() => { localStorage.setItem('hs_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('hs_wallet', JSON.stringify(wallet)); }, [wallet]);
  useEffect(() => { localStorage.setItem('hs_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('hs_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('hs_compare', JSON.stringify(compareList)); }, [compareList]);

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

  // -------------------------------------------------------------------
  // Wallet — mock balance + crypto deposit flow. No real blockchain is
  // connected; deposits and withdrawals are simulated by updating the
  // locally-persisted wallet balance and transaction history.
  // -------------------------------------------------------------------
  const deposit = useCallback((amount, method = 'Bitcoin') => {
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!amt || amt <= 0) return null;
    let tx;
    setWallet((prev) => {
      const next = Math.round((prev + amt) * 100) / 100;
      tx = { id: genId('TXN'), type: 'deposit', amount: amt, method, date: nowIso(), balanceAfter: next };
      return next;
    });
    setTransactions((prev) => [tx, ...prev]);
    pushNotification('deposit', 'Deposit Received', `$${amt.toFixed(2)} was added to your wallet via ${method}.`, '/wallet');
    return tx;
  }, [pushNotification]);

  // Withdraws available (non-escrowed) balance back out — mirrors deposit.
  // Returns null (and makes no change) if the amount exceeds the current
  // available balance, since escrowed funds are already excluded from it.
  const withdraw = useCallback((amount, method = 'Bitcoin') => {
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!amt || amt <= 0) return null;
    if (amt > wallet) return { success: false, reason: 'insufficient-balance' };
    let tx;
    setWallet((prev) => {
      const next = Math.round((prev - amt) * 100) / 100;
      tx = { id: genId('TXN'), type: 'withdrawal', amount: -amt, method, date: nowIso(), balanceAfter: next };
      return next;
    });
    setTransactions((prev) => [tx, ...prev]);
    pushNotification('withdrawal', 'Withdrawal Requested', `$${amt.toFixed(2)} is on its way to ${method}.`, '/wallet');
    return { success: true, transaction: tx };
  }, [wallet, pushNotification]);

  // -------------------------------------------------------------------
  // Orders — HStock purchase flow: Buy Now → wallet balance shown →
  // buyer confirms → wallet debited, funds held in escrow, order
  // created. No cart, no multi-item checkout: one product per order.
  // -------------------------------------------------------------------
  const confirmPurchase = useCallback(({ product, licenseId, licenseName, price }) => {
    const amount = Math.round(Number(price ?? product.price) * 100) / 100;
    if (wallet < amount) return { success: false, reason: 'insufficient-balance' };

    let order;
    setWallet((prevWallet) => {
      const nextBalance = Math.round((prevWallet - amount) * 100) / 100;
      order = {
        id: genId('ORD'),
        date: nowIso(),
        product: {
          ...product,
          id: product.id,
          title: product.title,
          img: product.img,
          cat: product.cat,
          artist: product.artist,
          sellerSlug: product.artistSlug || product.sellerSlug || null,
          quantity: product.quantity ?? 1,
        },
        licenseId: licenseId || null,
        licenseName: licenseName || null,
        amount,
        walletBalanceAfter: nextBalance,
        status: 'Processing',
        deliveryStatus: 'Awaiting Delivery',
        escrowStatus: 'Held',
        disputeOpen: false,
        messages: [
          {
            id: genId('MSG'),
            from: 'seller',
            text: `Thanks for your purchase! I'll get "${product.title}" delivered and hand over access shortly.`,
            date: nowIso(),
          },
        ],
      };
      setOrders((prevOrders) => [order, ...prevOrders]);
      setTransactions((prevTx) => [
        { id: genId('TXN'), type: 'purchase', amount: -amount, orderId: order.id, date: nowIso(), balanceAfter: nextBalance },
        ...prevTx,
      ]);
      return nextBalance;
    });

    pushNotification('purchase', 'Purchase Successful', `Your order for "${product.title}" is confirmed — funds are held in escrow.`, `/orders/${order.id}`);
    return { success: true, order };
  }, [wallet, pushNotification]);

  const getOrder = useCallback((orderId) => orders.find((o) => o.id === orderId) || null, [orders]);

  const sendOrderMessage = useCallback((orderId, text, from = 'buyer') => {
    if (!text || !text.trim()) return;
    let productTitle = null;
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      productTitle = o.product.title;
      const msg = { id: genId('MSG'), from, text: text.trim(), date: nowIso() };
      return { ...o, messages: [...o.messages, msg] };
    }));
    if (from !== 'buyer') {
      pushNotification('message', 'New Message', `New message about "${productTitle || 'your order'}".`, `/orders/${orderId}`);
    }
  }, [pushNotification]);

  // Marks the order received by the buyer: releases escrow to the seller
  // and completes the order. Frontend-only — no real payout happens.
  const confirmReceipt = useCallback((orderId) => {
    let productTitle = null;
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId || o.disputeOpen) return o;
      productTitle = o.product.title;
      return { ...o, status: 'Completed', deliveryStatus: 'Delivered', escrowStatus: 'Released' };
    }));
    if (productTitle) {
      pushNotification('escrow', 'Escrow Released', `Escrow for "${productTitle}" was released to the seller.`, `/orders/${orderId}`);
    }
  }, [pushNotification]);

  const openDispute = useCallback((orderId, reason) => {
    let productTitle = null;
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      productTitle = o.product.title;
      const note = {
        id: genId('MSG'),
        from: 'system',
        text: `Dispute opened${reason ? `: ${reason}` : ''}. Funds remain held in escrow while HStock support reviews this order.`,
        date: nowIso(),
      };
      return { ...o, disputeOpen: true, status: 'Disputed', escrowStatus: 'Disputed', messages: [...o.messages, note] };
    }));
    if (productTitle) {
      pushNotification('dispute', 'Dispute Updated', `A dispute was opened for "${productTitle}" — support is reviewing.`, `/orders/${orderId}`);
    }
  }, [pushNotification]);

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
      wallet, transactions, deposit, withdraw,
      orders, confirmPurchase, getOrder, sendOrderMessage, confirmReceipt, openDispute,
      notifications, markNotificationRead, markAllNotificationsRead,
      compareList, inCompare, toggleCompare, removeFromCompare, clearCompare, MAX_COMPARE,
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
