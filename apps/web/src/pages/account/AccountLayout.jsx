import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Package, Download, Settings, LogOut, Wallet,
  Star, ShieldCheck, Bell, MapPin, CreditCard, LifeBuoy, FileText, Ticket, Users, Clock,
  Menu, X, ChevronRight, AlertTriangle,
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useStore } from '../../context/StoreContext';

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
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderNavigation = (mobile = false) => (
    <div className={mobile ? 'space-y-5' : 'flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible'}>
      {groups.map((group) => (
        <div key={group.label} className={mobile ? 'space-y-2' : 'shrink-0 lg:shrink'}>
          <p className={`px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ${mobile ? 'hidden' : 'hidden lg:block'}`}>{group.label}</p>
          <div className={mobile ? 'space-y-1.5' : 'flex lg:flex-col gap-1'}>
            {group.links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setNavOpen(false)}
                  className={`flex items-center justify-between gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${active ? 'brand-gradient text-white' : 'text-foreground/80 hover:bg-secondary'}`}
                >
                  <span className="flex items-center gap-2.5">
                    <l.icon className="w-4 h-4 shrink-0" />
                    {l.label}
                  </span>
                  {!mobile && <ChevronRight className="w-4 h-4 opacity-60" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className={mobile ? 'border-t border-border pt-3' : 'shrink-0 lg:shrink lg:pt-2 lg:border-t lg:border-border'}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 mx-auto max-w-[90rem] w-full px-5 lg:px-8 pt-10 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">My Account</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-foreground shadow-sm transition-colors hover:bg-secondary"
              aria-label="Open account navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-foreground/80">Menu</span>
          </div>
          <p className="hidden lg:block text-sm text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{user?.name}</span></p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <nav className="bg-white rounded-3xl border border-border soft-shadow p-3 lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              {renderNavigation(false)}
            </nav>
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] lg:hidden ${navOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/30 transition-opacity ${navOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setNavOpen(false)}
        />
        <aside className={`absolute left-0 top-0 bottom-0 w-[88vw] max-w-[320px] bg-white shadow-2xl border-r border-border transition-transform duration-300 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">My Account</p>
              <h2 className="mt-1 text-lg font-black text-foreground">Account Menu</h2>
            </div>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground transition-colors hover:bg-muted"
              aria-label="Close account navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            {renderNavigation(true)}
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
};

export default AccountLayout;
