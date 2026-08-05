import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  User,
  Store,
  LogOut,
  Plus,
  Download,
  MessageSquare,
  MessageCircle,
  Bell,
  ShieldCheck,
  Menu,
  ChevronRight,
  X,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import Seo from '../components/Seo';
import Logo from '../components/Logo';
import PromoteStoreModal from '../components/PromoteStoreModal';
import VerifySellerModal from '../components/VerifySellerModal';
import { getSellerProducts } from './seller/api/sellerProducts';
import { useSellerAuth } from '../context/SellerAuthContext';
import { useDashboardBack } from '../hooks/useDashboardBack';
import { ordersApi } from '../services/ordersApi';
import { walletApi } from '../services/walletApi';
import { withdrawalsApi } from '../services/withdrawalsApi';
import { escrowApi } from '../services/escrowApi';
import { disputesApi } from '../services/disputesApi';
import {
  buildSalesChart,
  buildBestSelling,
  buildLowestStock,
  buildMostViewed,
  buildTopCategories,
  buildDownloadsFromOrders,
  buildActionRequired,
  summarizeSellerStats,
} from '../lib/sellerAnalytics';
import { clearRequestCache } from '../lib/requestCache';
import { NetworkErrorState } from '../components/ErrorState';
import { telegramApi } from '../services/telegramApi';
import { sellerStatisticsApi } from '../services/sellerStatisticsApi';
import { useStore } from '../context/StoreContext';

import SellerOverviewTab from './seller/components/SellerOverviewTab';
import SellerProductsTab from './seller/components/SellerProductsTab';
import SellerOrdersTab from './seller/components/SellerOrdersTab';
import SellerDownloadsTab from './seller/components/SellerDownloadsTab';
import SellerEarningsTab from './seller/components/SellerEarningsTab';
import SellerAnalyticsTab from './seller/components/SellerAnalyticsTab';
import SellerReviewsTab from './seller/components/SellerReviewsTab';
import SellerStoreSettingsTab from './seller/components/SellerStoreSettingsTab';
import SellerProfileTab from './seller/components/SellerProfileTab';
import SellerNotificationsTab from './seller/components/SellerNotificationsTab';
import SellerMessagesTab from './seller/components/SellerMessagesTab';
import SellerEscrowTab from './seller/components/SellerEscrowTab';
import SellerVerificationBanner from './seller/components/SellerVerificationBanner';
import SellerMobileNav from './seller/components/SellerMobileNav';

const tabs = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'escrow', label: 'Escrow', icon: ShieldCheck },
  { key: 'downloads', label: 'Downloads', icon: Download },
  { key: 'earnings', label: 'Wallet', icon: Wallet },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
  { key: 'disputes', label: 'Disputes', icon: ShieldCheck },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'store', label: 'Store', icon: Store },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'settings', label: 'Settings', icon: Store },
];
const TAB_KEYS = tabs.map((t) => t.key);

const menuGroups = [
  {
    label: 'Main',
    items: [
      { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/seller/overview' },
      { key: 'products', label: 'Products', icon: Package, to: '/seller/products' },
      { key: 'orders', label: 'Orders', icon: ShoppingCart, to: '/seller/orders' },
      { key: 'escrow', label: 'Escrow', icon: ShieldCheck, to: '/seller/escrow' },
      { key: 'messages', label: 'Disputes', icon: MessageCircle, to: '/seller/messages' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { key: 'downloads', label: 'Downloads', icon: Download, to: '/seller/downloads' },
      { key: 'earnings', label: 'Wallet', icon: Wallet, to: '/seller/earnings' },
      { key: 'analytics', label: 'Analytics', icon: BarChart3, to: '/seller/analytics' },
    ],
  },
  {
    label: 'Communications',
    items: [
      { key: 'reviews', label: 'Reviews', icon: MessageSquare, to: '/seller/reviews' },
      { key: 'notifications', label: 'Notifications', icon: Bell, to: '/seller/notifications' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { key: 'store', label: 'Store', icon: Store, to: '/seller/store' },
      { key: 'profile', label: 'Profile', icon: User, to: '/seller/profile' },
      { key: 'settings', label: 'Settings', icon: Settings, to: '/seller/settings' },
    ],
  },
];

const SellerDashboard = () => {
  const { seller, logout, refreshSeller } = useSellerAuth();
  const { refreshProfile } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const handleDashboardBack = useDashboardBack('/');
  const urlTab = location.pathname.split('/seller/')[1];
  const resolvedTab = urlTab === 'disputes' ? 'messages' : urlTab;
  const currentTab = TAB_KEYS.includes(resolvedTab) ? resolvedTab : 'overview';

  const [tab, setTab] = useState(currentTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const [sellerProducts, setSellerProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [commerce, setCommerce] = useState({
    orders: [],
    wallet: null,
    transactions: [],
    withdrawals: [],
    escrow: [],
    disputes: [],
    activity: [],
  });
  const [commerceTick, setCommerceTick] = useState(0);
  /** Shared Telegram status for banner + Action Required (from /telegram/me). */
  const [telegramStatus, setTelegramStatus] = useState(() => (
    seller?.telegram || null
  ));
  /** Shared Total Sales from GET /sellers/me/statistics (same as public profile). */
  const [apiStatistics, setApiStatistics] = useState(null);

  const loadProducts = async () => {
    setDataLoading(true);
    setLoadError(null);
    try {
      const data = await getSellerProducts();
      setSellerProducts(data);
    } catch (err) {
      setLoadError(err);
      setSellerProducts([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const force = commerceTick > 0;
      if (force) {
        clearRequestCache('wallet');
        clearRequestCache('wallet-tx');
        clearRequestCache('withdrawals');
        sellerStatisticsApi.invalidate();
        clearRequestCache('telegram');
      }
      const [ordersRes, walletRes, txRes, withdrawalsRes, escrowRes, disputesRes, statsRes, telegramRes] = await Promise.all([
        ordersApi.list({ page: 1, limit: 100, scope: 'seller' }).catch(() => ({ items: [] })),
        walletApi.me({ force }).catch(() => null),
        walletApi.transactions({ page: 1, limit: 50, force }).catch(() => ({ items: [] })),
        withdrawalsApi.list({ page: 1, limit: 50 }).catch(() => ({ items: [] })),
        escrowApi.list({ page: 1, limit: 50 }).catch(() => ({ items: [] })),
        disputesApi.list({ page: 1, limit: 50, scope: 'seller' }).catch(() => ({ items: [] })),
        sellerStatisticsApi.me({ force }).catch(() => null),
        telegramApi.status().catch(() => null),
      ]);
      if (!alive) return;
      setCommerce({
        orders: ordersRes.items || [],
        wallet: walletRes,
        transactions: txRes.items || [],
        withdrawals: withdrawalsRes.items || [],
        escrow: escrowRes.items || [],
        disputes: disputesRes.items || [],
        activity: [],
      });
      if (statsRes) setApiStatistics(statsRes);
      if (telegramRes) setTelegramStatus(telegramRes);
    })();
    return () => { alive = false; };
  }, [commerceTick]);

  const handleTelegramStatusChange = async (next) => {
    if (next) setTelegramStatus(next);
    await telegramApi.invalidateCaches();
    sellerStatisticsApi.invalidate();
    try {
      await refreshProfile();
    } catch {
      // ignore profile refresh failures
    }
  };

  useEffect(() => telegramApi.subscribe((next) => {
    if (next) setTelegramStatus(next);
  }), []);

  const refreshCommerce = (opts = {}) => {
    if (opts.force) {
      clearRequestCache('wallet');
      clearRequestCache('wallet-tx');
      clearRequestCache('withdrawals');
    }
    setCommerceTick((t) => t + 1);
  };

  useEffect(() => {
    setTab(currentTab);
  }, [currentTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('promote') === '1') {
      setPromoteOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  const analytics = useMemo(() => {
    const salesChart7 = buildSalesChart(commerce.orders, 7);
    const salesChart30 = buildSalesChart(commerce.orders, 30);
    const salesChart = salesChart30;
    const bestSelling = buildBestSelling(commerce.orders, sellerProducts, 8);
    const lowestStock = buildLowestStock(sellerProducts, 8);
    const mostViewed = buildMostViewed(sellerProducts, 8);
    const topCategories = buildTopCategories(commerce.orders, sellerProducts, 6);
    const downloads = buildDownloadsFromOrders(commerce.orders);
    const statsBase = summarizeSellerStats({
      orders: commerce.orders,
      products: sellerProducts,
      wallet: commerce.wallet,
      escrow: commerce.escrow,
      withdrawals: commerce.withdrawals,
      disputes: commerce.disputes,
    });
    // Prefer live API Total Sales (same aggregation as public profile / featured stores).
    const totalSales = apiStatistics && typeof apiStatistics.totalSales === 'number'
      ? Number(apiStatistics.totalSales)
      : statsBase.totalSales;
    const stats = {
      ...statsBase,
      totalSales,
      grossSales: totalSales,
    };
    const actionRequired = buildActionRequired({
      products: sellerProducts,
      orders: commerce.orders,
      disputes: commerce.disputes,
      seller,
      telegramStatus: telegramStatus ?? seller?.telegram ?? null,
    });
    return {
      salesChart,
      salesChart7,
      salesChart30,
      bestSelling,
      lowestStock,
      mostViewed,
      topCategories,
      downloads,
      stats,
      actionRequired,
    };
  }, [commerce, sellerProducts, seller, telegramStatus, apiStatistics]);

  const overviewOrders = commerce.orders.map((o) => ({
    id: o.id,
    customer: o.buyer?.email || o.buyer?.name || 'Buyer',
    product: o.product?.title,
    productImg: o.product?.img,
    amount: o.amount,
    date: o.date,
    status: o.status,
  }));

  const changeTab = (key) => {
    const target = key === 'disputes' ? 'messages' : key;
    setTab(target);
    navigate(`/seller/${target}`, { replace: true });
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const joinedDate = seller?.joinedAt
    ? new Date(seller.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : 'Recently';

  const renderSidebarContent = ({ scrollable = false } = {}) => (
    <div className={scrollable ? 'flex h-full min-h-0 flex-col' : 'flex h-full flex-col'}>
      <div className="mb-6 shrink-0">
        <Logo to="/" size="sidebar" className="mb-4" />
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">Seller portal</p>
        <h2 className="mt-3 text-2xl font-black text-foreground">{seller?.storeName || 'Your Store'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{seller?.email}</p>
      </div>

      <div
        className={`min-h-0 flex-1 space-y-8 pr-1 ${scrollable ? 'overflow-y-auto overscroll-contain' : 'overflow-y-auto'}`}
        style={scrollable ? { WebkitOverflowScrolling: 'touch' } : undefined}
      >
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">{group.label}</p>
            <nav className="space-y-2">
              {group.items.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => changeTab(item.key)}
                  className={`group flex items-center justify-between gap-3 rounded-[1.75rem] px-4 py-3 text-sm font-semibold transition ${tab === item.key ? 'bg-primary/10 text-foreground shadow-sm border border-primary/20' : 'text-foreground/70 hover:bg-secondary hover:text-foreground border border-transparent'}`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${tab === item.key ? 'text-primary' : 'text-foreground/50 group-hover:text-primary'}`} />
                    {item.label}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-foreground/40`} />
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-6 shrink-0 border-t border-border pt-5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary transition-colors"
        >
          <LogOut className="h-4 w-4 text-primary" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo title="Seller Dashboard" description="Manage your ApnaStore store, listings, and earnings." noIndex />

      {/*
        Mobile uses normal document flow (single page scroll).
        Desktop keeps the sticky sidebar + main split. Do not introduce
        nested page scrollers or absolutely positioned dashboard cards.
      */}
      <div className="relative w-full lg:flex">
        <aside className="hidden lg:flex lg:h-screen lg:w-[320px] lg:sticky lg:top-0 shrink-0 flex-col border-r border-border bg-white px-6 py-8 shadow-sm overflow-hidden">
          {renderSidebarContent({ scrollable: true })}
        </aside>

        <div className="relative z-0 flex w-full min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-50 border-b border-border bg-white pt-safe lg:hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleDashboardBack}
                className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-secondary text-foreground hover:bg-muted transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Seller</p>
                <p className="font-semibold text-foreground truncate max-w-[180px]">{seller?.storeName || 'Your Store'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-secondary text-foreground hover:bg-muted transition-colors"
                aria-label="Open seller menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/*
            Only mount the full-viewport drawer shell while open.
            An always-present fixed inset-0 layer (even with pointer-events-none)
            creates a competing compositing/stacking context on mobile and is a
            common cause of overlapping cards + inconsistent scroll.
          */}
          {sidebarOpen ? (
            <div className="fixed inset-0 z-[45] lg:hidden" data-testid="seller-mobile-drawer">
              <div
                className="absolute inset-0 bg-slate-900/20"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <aside
                className="absolute left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-[min(88vw,320px)] flex-col overflow-hidden bg-white p-6 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-safe shadow-2xl border-r border-border"
                role="dialog"
                aria-modal="true"
                aria-label="Seller menu"
              >
                <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-secondary text-foreground hover:bg-muted transition-colors"
                    aria-label="Close seller menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  {renderSidebarContent({ scrollable: true })}
                </div>
              </aside>
            </div>
          ) : null}

          <main className="relative z-0 mx-auto w-full min-w-0 max-w-[1080px] flex-1 px-4 py-8 pb-28 sm:px-6 lg:px-10 lg:pb-10">
            <SellerVerificationBanner
              seller={seller}
              telegramStatus={telegramStatus}
              onTelegramStatusChange={handleTelegramStatusChange}
            />

            {tab !== 'overview' ? (
              <div className="mb-8 flex flex-col gap-4 rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.28em] text-primary">Seller portal</p>
                  <h1 className="mt-2 truncate text-2xl font-black tracking-tight text-foreground">
                    {tabs.find((item) => item.key === tab)?.label || 'Dashboard'}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {seller?.storeName || 'Your store'} · Joined {joinedDate}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/seller/products/new"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </Link>
                  <Link
                    to="/seller/earnings"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    <Wallet className="h-4 w-4 text-primary" /> Withdraw
                  </Link>
                </div>
              </div>
            ) : null}

            {dataLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-[2rem] bg-secondary" />)}
              </div>
            ) : loadError ? (
              <NetworkErrorState onRetry={loadProducts} message={loadError.message} />
            ) : (
              <div className="flex w-full min-w-0 flex-col gap-6 sm:gap-8">
                {tab === 'overview' && (
                  <SellerOverviewTab
                    seller={seller}
                    products={sellerProducts}
                    orders={overviewOrders}
                    stats={analytics.stats}
                    salesChart7={analytics.salesChart7}
                    salesChart30={analytics.salesChart30}
                    bestSelling={analytics.bestSelling}
                    lowestStock={analytics.lowestStock}
                    mostViewed={analytics.mostViewed}
                    actionRequired={analytics.actionRequired}
                    joinedDate={joinedDate}
                    onPromote={() => setPromoteOpen(true)}
                    onVerify={() => setVerifyOpen(true)}
                  />
                )}
                {tab === 'products' && <SellerProductsTab />}
                {tab === 'orders' && (
                  <SellerOrdersTab
                    orders={commerce.orders}
                    onRefresh={refreshCommerce}
                  />
                )}
                {tab === 'escrow' && (
                  <SellerEscrowTab escrowItems={commerce.escrow} />
                )}
                {tab === 'downloads' && <SellerDownloadsTab downloads={analytics.downloads} />}
                {tab === 'earnings' && (
                  <SellerEarningsTab
                    wallet={commerce.wallet}
                    transactions={commerce.transactions}
                    withdrawals={commerce.withdrawals}
                    onRefresh={refreshCommerce}
                    canWithdraw={String(seller?.status || '').toLowerCase() === 'approved'}
                    stats={analytics.stats}
                    onTelegramStatusChange={handleTelegramStatusChange}
                  />
                )}
                {tab === 'analytics' && (
                  <SellerAnalyticsTab
                    orders={overviewOrders}
                    salesChart={analytics.salesChart30}
                    salesChart7={analytics.salesChart7}
                    bestSelling={analytics.bestSelling}
                    topCategories={analytics.topCategories}
                    stats={analytics.stats}
                  />
                )}
                {(tab === 'messages' || tab === 'disputes') && <SellerMessagesTab />}
                {tab === 'reviews' && <SellerReviewsTab reviews={[]} />}
                {tab === 'notifications' && <SellerNotificationsTab />}
                {tab === 'store' && (
                  <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-foreground">Your public storefront</h3>
                    <p className="text-sm text-muted-foreground">This is what buyers see when they visit your store page.</p>
                    {String(seller?.status || '').toLowerCase() === 'approved' ? (
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`/seller/${seller?.slug || (seller?.storeName || 'your-store').toLowerCase().replace(/\s+/g, '-')}`}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Store className="h-4 w-4" /> View storefront
                        </a>
                        <button
                          type="button"
                          onClick={() => setPromoteOpen(true)}
                          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                        >
                          Promote Store
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Public Store URL is disabled while your seller account is {seller?.status || 'pending'}.
                        It will unlock automatically after admin approval.
                      </div>
                    )}
                  </div>
                )}
                {tab === 'profile' && (
                  <SellerProfileTab
                    seller={seller}
                    productsCount={sellerProducts.length}
                    joinedDate={joinedDate}
                    onTelegramStatusChange={handleTelegramStatusChange}
                  />
                )}
                {tab === 'settings' && (
                  <SellerStoreSettingsTab
                    seller={seller}
                    canManagePayouts={String(seller?.status || '').toLowerCase() === 'approved'}
                    onTelegramStatusChange={handleTelegramStatusChange}
                  />
                )}
              </div>
            )}
          </main>
          <SellerMobileNav current={tab} onNavigate={changeTab} />
        </div>
      </div>

      <PromoteStoreModal
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        onSuccess={() => refreshCommerce({ force: true })}
      />
      <VerifySellerModal
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onSuccess={() => {
          refreshCommerce({ force: true });
          refreshSeller?.().catch(() => null);
        }}
      />
    </div>
  );
};

export default SellerDashboard;
