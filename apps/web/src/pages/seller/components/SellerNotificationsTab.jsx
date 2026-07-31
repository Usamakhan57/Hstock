import React, { useEffect, useState } from 'react';
import { Bell, ShoppingCart, MessageSquare, Wallet, Info } from 'lucide-react';
import EmptyState from '../../../admin/components/EmptyState';

const ICONS = { order: ShoppingCart, review: MessageSquare, payout: Wallet, system: Info };

const fmtRelative = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const SellerNotificationsTab = ({ notifications: initial = [] }) => {
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setNotifications(initial || []);
  }, [initial]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === 'all' ? notifications : notifications.filter((n) => (filter === 'unread' ? !n.read : n.read));

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

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
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === t.key ? 'brand-gradient text-white' : 'border border-border hover:bg-secondary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={markAllRead} disabled={unreadCount === 0} className="text-sm font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:underline">
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
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-colors hover:bg-secondary/40 ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <span className="w-9 h-9 rounded-xl bg-secondary grid place-items-center shrink-0"><Icon className="w-4 h-4 text-primary" /></span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.read ? 'font-semibold' : ''}`}>{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtRelative(n.date)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
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
