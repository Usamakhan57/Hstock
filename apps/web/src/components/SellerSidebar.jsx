import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bell, LayoutDashboard, LogOut, MessageCircleQuestion, Package, Settings, ShieldCheck, ShoppingCart, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarOverlay from './SidebarOverlay';
import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import SidebarFooter from './SidebarFooter';

const SellerSidebar = ({ open, closing, onClose, seller, walletBalance, notificationsCount, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const menuItems = useMemo(() => [
    { label: 'Dashboard', to: '/seller/dashboard', icon: LayoutDashboard },
    { label: 'Products', to: '/seller/products', icon: Package },
    { label: 'Orders', to: '/seller/orders', icon: ShoppingCart },
    { label: 'Disputes', to: '/seller/messages', icon: ShieldCheck },
    { label: 'Withdrawals', to: '/seller/earnings', icon: Wallet },
    { label: 'Referral & Rewards', to: '/seller/notifications', icon: Bell },
    { label: 'Settings', to: '/seller/settings', icon: Settings },
    { label: 'Support', to: '/support', icon: MessageCircleQuestion },
  ], []);

  const storeSlug = seller?.slug
    || seller?.storeName?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    || '';
  const isApproved = String(seller?.status || '').toLowerCase() === 'approved';
  const footerLinks = useMemo(() => [
    { label: '+ Add Product', to: '/seller/products/new', primary: true },
    {
      label: isApproved ? 'Platform Store' : 'Platform Store (pending)',
      to: isApproved ? `/seller/${storeSlug}` : '/seller/overview',
      primary: false,
      disabled: !isApproved,
    },
    { label: 'Promote Store', to: '/seller/analytics', primary: false },
  ], [storeSlug, isApproved]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const focusTarget = firstFocusableRef.current ?? panelRef.current?.querySelector('a, button') ?? null;
    focusTarget?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleNavigate = () => onClose();
  const handleBackToMarketplace = () => {
    onClose();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  const handleLogout = () => {
    onLogout();
    onClose();
    navigate('/');
  };

  const panelMotion = closing
    ? '-translate-y-full sm:translate-y-0 sm:translate-x-full'
    : 'translate-y-0 sm:translate-x-0';

  return createPortal(
    <div className="fixed inset-0 z-[45] pointer-events-none">
      <div className="pointer-events-auto">
        <SidebarOverlay open={open} onClose={onClose} />
      </div>
      <aside
        ref={panelRef}
        role="dialog"
        aria-label="Seller sidebar"
        aria-modal="true"
        className={`pointer-events-auto fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top,0px))] z-[46] flex max-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] w-full flex-col overflow-hidden bg-white shadow-[0_20px_80px_-24px_rgba(15,23,42,0.35)] border-b border-[#E5E7EB] transition-transform duration-250 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:max-h-[100dvh] sm:h-[100vh] sm:w-[380px] sm:border-b-0 sm:border-l lg:w-[420px] ${panelMotion}`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex min-h-full flex-col">
            <div className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white px-4 py-3 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleBackToMarketplace}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 hover:text-primary transition-colors focus-visible:outline-none"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Marketplace
              </button>
            </div>
            <SidebarHeader
              seller={seller}
              walletBalance={walletBalance}
              notificationsCount={notificationsCount}
              onNavigate={handleNavigate}
            />

            <div className="flex-1 px-4 py-4">
              <div className="space-y-2.5">
                <SidebarNavigation items={menuItems} activePath={location.pathname} onNavigate={handleNavigate} />

                <SidebarFooter footerLinks={footerLinks} onNavigate={handleNavigate} />

                <button
                  type="button"
                  ref={firstFocusableRef}
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-[1.2rem] border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm font-semibold text-destructive transition-all duration-200 hover:bg-red-50"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-red-600">
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                  </span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
};

export default SellerSidebar;
