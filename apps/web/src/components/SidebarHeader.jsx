import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Bell, Sparkles } from 'lucide-react';
import Logo from './Logo';

const cardClassName =
  'rounded-[1.2rem] border border-[#E5E7EB] bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-secondary/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const SidebarHeader = ({ seller, walletBalance, notificationsCount, onNavigate }) => (
  <div className="border-b border-[#E5E7EB] bg-white px-5 py-5">
    <div className="mb-4">
      <Logo to="/" size="sidebar" />
    </div>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="grid h-14 w-14 place-items-center rounded-[1.3rem] bg-primary/10 text-xl font-black text-primary shrink-0">
          {seller?.storeName?.charAt(0) || 'S'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{seller?.storeName || 'Seller Workspace'}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{seller?.email || 'seller@apnastore.app'}</p>
          <span className="mt-3 inline-flex rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
            Seller
          </span>
        </div>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shrink-0">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Live
      </span>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <Link
        to="/seller/earnings"
        onClick={onNavigate}
        aria-label="Open wallet"
        className={cardClassName}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Wallet
        </div>
        <p className="mt-2 text-lg font-semibold text-foreground">${Number(walletBalance || 0).toFixed(2)}</p>
      </Link>
      <Link
        to="/seller/notifications"
        onClick={onNavigate}
        aria-label="Open alerts"
        className={cardClassName}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Bell className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Alerts
        </div>
        <p className="mt-2 text-lg font-semibold text-foreground">{notificationsCount} unread</p>
      </Link>
    </div>
  </div>
);

export default SidebarHeader;
