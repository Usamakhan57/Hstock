import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Package, Download, Settings, LogOut, Wallet,
  Star, ShieldCheck, Bell, MapPin, CreditCard, LifeBuoy, FileText, Ticket, Users, Clock,
  Menu, X, ChevronRight, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Logo from '../../components/Logo';
import { useStore } from '../../context/StoreContext';
import { useDashboardBack } from '../../hooks/useDashboardBack';

const groups = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Shopping',
    links: [
      { to: '/orders', label: 'Orders', icon: Package },
      { to: '/disputes', label: 'Disputes', icon: AlertTriangle },
      { to: '/downloads', label: 'Downloads', icon: Download },
      { to: '/wallet', label: 'Wallet', icon: Wallet },
      { to: '/coupons', label: 'Coupons', icon: Ticket },
      { to: '/invoices', label: 'Invoices', icon: FileText },
    ],
  },
  {
    label: 'Community',
    links: [
      { to: '/reviews', label: 'Reviews', icon: Star },
      { to: '/following', label: 'Following', icon: Users },
      { to: '/browsing-history', label: 'Browsing History', icon: Clock },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/security', label: 'Security', icon: ShieldCheck },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/addresses', label: 'Access Details', icon: MapPin },
      { to: '/payment-methods', label: 'Crypto Wallets', icon: CreditCard },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'Help',
    links: [
      { to: '/support', label: 'Support', icon: LifeBuoy },
    ],
  },
];

const AccountLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const handleDashboardBack = useDashboardBack('/shop');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setNavOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Keep body scroll unlocked so the drawer itself can scroll on mobile browsers.
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderNavigation = (mobile = false) => (
    <div className={mobile ? 'space-y-5' : 'flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible'}>
      {groups.map((group) => (
        <div key={group.label} className={mobile ? 'space-y-2' : 'shrink-0 lg:shrink'}>
          <p className={`px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ${mobile ? 'block' : 'hidden lg:block'}`}>{group.label}</p>
          <div className={mobile ? 'space-y-1.5' : 'flex lg:flex-col gap-1'}>
            {group.links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setNavOpen(false)}
                  className={`flex items-center justify-between gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors active:scale-[0.99] ${active ? 'brand-gradient text-white' : 'text-foreground/80 hover:bg-secondary'}`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <l.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{l.label}</span>
                  </span>
                  {!mobile && <ChevronRight className="w-4 h-4 opacity-60 shrink-0" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className={mobile ? 'border-t border-border pt-3' : 'shrink-0 lg:shrink lg:pt-2 lg:border-t lg:border-border'}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <Header />
      {/* Sits under the marketplace header — never competes with hamburger / FAB */}
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top,0px))] sm:top-[calc(5rem+env(safe-area-inset-top,0px))] md:top-[calc(5.5rem+env(safe-area-inset-top,0px))] z-40 border-b border-border bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleDashboardBack}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-foreground shadow-sm transition-colors hover:bg-secondary active:scale-[0.98]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">My Account</p>
            <p className="truncate text-sm font-bold text-foreground">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-foreground shadow-sm transition-colors hover:bg-secondary active:scale-[0.98]"
            aria-label="Open account navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-[90rem] w-full px-4 sm:px-5 lg:px-8 pt-6 sm:pt-10 pb-[max(5rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))] overflow-x-clip">
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">My Account</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 break-words">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>}
          </div>
          <p className="hidden lg:block text-sm text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{user?.name}</span></p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <nav className="bg-white rounded-3xl border border-border soft-shadow p-3 lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              {renderNavigation(false)}
            </nav>
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>

      {/* Buyer drawer — below marketplace header (z-50), above page content */}
      <div className={`fixed inset-0 z-[45] lg:hidden ${navOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/30 transition-opacity ${navOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setNavOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-[100vh] max-h-[100dvh] w-[min(88vw,320px)] flex-col overflow-hidden bg-white shadow-2xl border-r border-border transition-transform duration-300 ease-out pb-safe pl-safe ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 pt-[max(1rem,env(safe-area-inset-top,0px))]">
            <div className="min-w-0">
              <Logo to="/" size="sidebar" onClick={() => setNavOpen(false)} />
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">My Account</p>
              <h2 className="mt-1 text-lg font-black text-foreground">Account Menu</h2>
            </div>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
              aria-label="Close account navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {renderNavigation(true)}
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
};

export default AccountLayout;
