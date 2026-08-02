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
    document.body.style.overflow = 'hidden';
    const focusTarget = firstFocusableRef.current ?? panelRef.current?.querySelector('a, button') ?? null;
    focusTarget?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
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

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <SidebarOverlay open={open} onClose={onClose} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-label="Seller sidebar"
        aria-modal="true"
        className={`fixed right-0 top-0 bottom-0 z-[71] h-screen w-full overflow-hidden bg-white shadow-[0_20px_80px_-24px_rgba(15,23,42,0.35)] border-l border-[#E5E7EB] transition-transform duration-250 ease-out sm:w-[380px] lg:w-[420px] ${closing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="h-full overflow-y-auto">
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
            <SidebarHeader seller={seller} walletBalance={walletBalance} notificationsCount={notificationsCount} />

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
