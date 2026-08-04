import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, MessageSquare, Wallet, Info, Megaphone, Truck, ShieldCheck } from 'lucide-react';
import EmptyState from '../../../admin/components/EmptyState';
import { useStore } from '../../../context/StoreContext';

const ICONS = {
  order: ShoppingCart,
  order_created: ShoppingCart,
  payment_success: Wallet,
  review: MessageSquare,
  payout: Wallet,
  wallet_deposit: Wallet,
  wallet_topup: Wallet,
  withdrawal_requested: Wallet,
  withdrawal_paid: Wallet,
  delivery: Truck,
  escrow_locked: ShieldCheck,
  escrow_released: ShieldCheck,
  dispute_opened: ShieldCheck,
  dispute_message: MessageSquare,
  store_promotion: Megaphone,
  announcement: Megaphone,
  system: Info,
  message: MessageSquare,
};

const fmtRelative = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

function resolveSellerLink(n) {
  if (n?.link) return n.link;
  const type = String(n?.type || '');
  if (type.startsWith('order_') || type === 'purchase' || type === 'payment_success') return '/seller/orders';
  if (type.startsWith('dispute_') || type.startsWith('replacement_') || type === 'message') return '/seller/messages';
  if (type.startsWith('wallet_') || type.startsWith('withdrawal_') || type.startsWith('escrow_')) return '/seller/earnings';
  if (type === 'store_promotion') return '/seller/overview?promote=1';
  if (type === 'product_moderated' || type === 'inventory_low') return '/seller/products';
  if (type === 'review') return '/seller/reviews';
  return '/seller/notifications';
}

/**
 * Seller notifications — uses real Notification API via StoreContext
 * (not ActivityLog auth noise).
 */
const SellerNotificationsTab = () => {
  const navigate = useNavigate();
  const {
    notifications: storeNotifications = [],
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(storeNotifications);

  useEffect(() => {
    setNotifications(storeNotifications || []);
  }, [storeNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );
  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => (filter === 'unread' ? !n.read : n.read));

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead?.();
    } catch {
      // ignore
    }
  };

  const handleOpen = async (n) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((row) => (row.id === n.id ? { ...row, read: true } : row)));
      try {
        await markNotificationRead?.(n.id);
      } catch {
        // keep navigation responsive
      }
    }
    const href = resolveSellerLink(n);
    if (String(href).startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(href);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
            { key: 'read', label: 'Read' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === t.key ? 'brand-gradient text-white' : 'border border-border hover:bg-secondary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="text-sm font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((n) => {
              const Icon = ICONS[n.type] || Info;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className={`w-full text-left flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-colors hover:bg-secondary/40 ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-secondary grid place-items-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? 'font-semibold' : ''}`}>{n.title || n.message}</p>
                      {n.body ? <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p> : null}
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtRelative(n.date)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SellerNotificationsTab;
