import React from 'react';
import { Wallet, Bell, Sparkles } from 'lucide-react';

const SidebarHeader = ({ seller, walletBalance, notificationsCount }) => (
  <div className="border-b border-[#E5E7EB] bg-white px-5 py-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <span className="grid h-14 w-14 place-items-center rounded-[1.3rem] bg-primary/10 text-xl font-black text-primary">
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
      <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Live
      </span>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-[1.2rem] border border-[#E5E7EB] bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Wallet
        </div>
        <p className="mt-2 text-lg font-semibold text-foreground">${walletBalance.toFixed(2)}</p>
      </div>
      <div className="rounded-[1.2rem] border border-[#E5E7EB] bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Bell className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Alerts
        </div>
        <p className="mt-2 text-lg font-semibold text-foreground">{notificationsCount} unread</p>
      </div>
    </div>
  </div>
);

export default SidebarHeader;
