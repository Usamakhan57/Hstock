import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShoppingBag, ArrowDownCircle, Truck, ShieldCheck, MessageCircle, AlertTriangle, CheckCheck, Trash2 } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useStore } from '../../context/StoreContext';

const TABS = ['All', 'Unread', 'Read'];

const categoryIcon = {
  purchase: ShoppingBag,
  deposit: ArrowDownCircle,
  withdrawal: ArrowDownCircle,
  delivery: Truck,
  escrow: ShieldCheck,
  message: MessageCircle,
  dispute: AlertTriangle,
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const NotificationsPage = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useStore();
  const [tab, setTab] = useState('All');

  const filtered = notifications.filter((n) => tab === 'All' || (tab === 'Unread' ? !n.read : n.read));

  return (
    <>
      <Seo title="Notifications" description="Your HStock notification center." noIndex />
      <AccountLayout title="Notifications" subtitle="Purchases, deposits, deliveries, escrow, and message alerts.">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === t ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}>{t}</button>
            ))}
          </div>
          <button onClick={markAllNotificationsRead} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="Nothing here" message="You're all caught up." actionLabel="Go to Dashboard" actionTo="/dashboard" />
        ) : (
          <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
            {filtered.map((n) => {
              const Icon = categoryIcon[n.type] || Bell;
              const content = (
                <>
                  <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${n.read ? 'bg-secondary' : 'bg-primary/10'}`}>
                    <Icon className={`w-4.5 h-4.5 ${n.read ? 'text-muted-foreground' : 'text-primary'}`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.date)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={() => markNotificationRead(n.id)} className="w-full text-left flex items-start gap-3 p-4 hover:bg-secondary/40 transition-colors group">
                  {content}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(n.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-red-600 shrink-0"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <div key={n.id} className="w-full text-left flex items-start gap-3 p-4 hover:bg-secondary/40 transition-colors group">
                  <button type="button" onClick={() => markNotificationRead(n.id)} className="flex items-start gap-3 flex-1 min-w-0 text-left">
                    {content}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification(n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-red-600 shrink-0"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </AccountLayout>
    </>
  );
};

export default NotificationsPage;
