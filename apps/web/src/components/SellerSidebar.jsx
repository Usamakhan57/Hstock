import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import SidebarFooter from './SidebarFooter';

/**
 * Seller Workspace — profile-style account dropdown (NOT a drawer / sheet).
 *
 * Anchored under the marketplace header:
 * - Desktop: ~420px, right-aligned with the Seller Workspace FAB, auto height
 * - Mobile: full width minus margins, below header, auto height
 *
 * Animation only: opacity 0→1 + translateY(-10px→0), 180ms ease-out.
 * No translate-x, no bottom sheet, no full-height side panel.
 */
const SellerSidebar = ({ open, closing, onClose, seller, walletBalance, notificationsCount, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [pos, setPos] = useState(null);

  const menuItems = useMemo(() => [
    { label: 'Dashboard', to: '/seller/dashboard', icon: LayoutDashboard },
    { label: 'Products', to: '/seller/products', icon: Package },
    { label: 'Orders', to: '/seller/orders', icon: ShoppingCart },
    { label: 'Customers', to: '/seller/reviews', icon: Users },
    { label: 'Inventory', to: '/seller/products', icon: Boxes },
    { label: 'Analytics', to: '/seller/analytics', icon: BarChart3 },
    { label: 'Wallet', to: '/seller/earnings', icon: Wallet },
    { label: 'Withdrawals', to: '/seller/earnings', icon: Wallet },
    { label: 'Disputes', to: '/seller/disputes', icon: ShieldCheck },
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
    {
      label: 'Promote Store',
      to: '/seller/overview?promote=1',
      primary: false,
    },
  ], [storeSlug, isApproved]);

  // Position like a profile dropdown under the sticky header (never flush side sheet).
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }

    const update = () => {
      const header = document.querySelector('[data-marketplace-header]');
      const fab = document.querySelector('[data-testid="seller-fab"]');
      const headerBottom = header?.getBoundingClientRect().bottom ?? 72;
      const top = Math.max(8, headerBottom + 8);
      const viewportH = window.innerHeight;
      const maxHeight = Math.max(240, viewportH - top - 16);
      const isDesktop = window.innerWidth >= 1024;

      if (isDesktop) {
        const width = 420;
        let right = 16;
        if (fab) {
          const fabRect = fab.getBoundingClientRect();
          right = Math.max(8, Math.round(window.innerWidth - fabRect.right));
        }
        setPos({
          top,
          right,
          left: null,
          width,
          maxHeight,
          mode: 'desktop',
        });
        return;
      }

      setPos({
        top,
        left: 12,
        right: 12,
        width: null,
        maxHeight,
        mode: 'mobile',
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || closing) {
      setEntered(false);
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, closing]);

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

  if (!open || !pos) return null;

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

  const showOpen = entered && !closing;
  const panelMotion = showOpen
    ? 'translate-y-0 opacity-100'
    : '-translate-y-2.5 opacity-0 pointer-events-none';

  const panelStyle = {
    position: 'fixed',
    top: pos.top,
    maxHeight: pos.maxHeight,
    zIndex: 101,
    ...(pos.mode === 'desktop'
      ? { right: pos.right, width: pos.width, left: 'auto' }
      : { left: pos.left, right: pos.right, width: 'auto' }),
  };

  return createPortal(
    <div className="contents" data-testid="seller-workspace-root">
      {/* Transparent dismiss layer — not a modal scrim / drawer overlay */}
      <button
        type="button"
        aria-label="Close seller workspace"
        data-testid="seller-workspace-dismiss"
        onClick={onClose}
        className={`fixed inset-0 z-[100] cursor-default bg-transparent transition-opacity duration-[180ms] ease-out ${
          showOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        ref={panelRef}
        role="menu"
        aria-label="Seller workspace"
        data-testid="seller-workspace-menu"
        data-open={showOpen ? 'true' : 'false'}
        data-mode={pos.mode}
        style={panelStyle}
        className={[
          'z-[101] flex flex-col overflow-hidden',
          'bg-white border border-[#E5E7EB] rounded-2xl',
          'shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]',
          'transition-[transform,opacity] duration-[180ms] ease-out',
          'h-auto w-auto',
          panelMotion,
        ].join(' ')}
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex flex-col">
            <div className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white px-4 py-3">
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

            <div className="flex flex-col">
              <div className="space-y-2.5 px-4 py-4">
                <SidebarNavigation items={menuItems} activePath={location.pathname} onNavigate={handleNavigate} />
              </div>

              <SidebarFooter footerLinks={footerLinks} onNavigate={handleNavigate} />

              <div className="px-4 pb-4">
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
      </div>
    </div>,
    document.body,
  );
};

export default SellerSidebar;
