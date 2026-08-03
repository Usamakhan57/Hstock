import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  Star,
  Wallet,
  Package,
} from 'lucide-react';

const ITEMS = [
  { key: 'overview', label: 'Home', icon: Home, to: '/seller/overview' },
  { key: 'new', label: 'Add', icon: PlusCircle, to: '/seller/products/new' },
  { key: 'analytics', label: 'Rank', icon: Star, to: '/seller/analytics' },
  { key: 'earnings', label: 'Withdraw', icon: Wallet, to: '/seller/earnings' },
  { key: 'products', label: 'Products', icon: Package, to: '/seller/products' },
];

/**
 * Mobile bottom navigation inspired by premium seller control panels.
 * Desktop uses the existing sidebar — this is mobile-only.
 */
const SellerMobileNav = ({ current, onNavigate }) => (
  <nav
    className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-safe backdrop-blur lg:hidden"
    aria-label="Seller mobile navigation"
  >
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
      {ITEMS.map((item) => {
        const active = item.key === 'new' ? false : current === item.key;
        const Icon = item.icon;
        if (item.key === 'new') {
          return (
            <Link
              key={item.key}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate?.(item.key)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
            {item.label}
          </button>
        );
      })}
    </div>
  </nav>
);

export default SellerMobileNav;
