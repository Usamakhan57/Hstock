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
} from 'lucide-react';
import Seo from '../components/Seo';
import { loadStorefrontProducts } from '../services/productRepository';
import { getSellerProducts } from './seller/api/sellerProducts';
import { getSellerMockData } from './seller/data/sellerMockData';
import { useSellerAuth } from '../context/SellerAuthContext';
import { ordersApi } from '../services/ordersApi';
import { walletApi } from '../services/walletApi';
import { withdrawalsApi } from '../services/withdrawalsApi';
import { escrowApi } from '../services/escrowApi';

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

const tabs = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'escrow', label: 'Escrow', icon: ShieldCheck },
  { key: 'downloads', label: 'Downloads', icon: Download },
  { key: 'earnings', label: 'Wallet', icon: Wallet },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
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
      { key: 'messages', label: 'Messages', icon: MessageCircle, to: '/seller/messages' },
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

// This dashboard reads the fuller storefront catalog (allProducts) only to
// seed realistic-looking demo activity in sellerMockData — the seller's own
// editable catalog for the Products tab comes from ./seller/api/sellerProducts,
// which has real create/read/update/delete via the same mock-DB engine the
// Admin Panel uses (see admin/api/db.js).
const allProducts = loadStorefrontProducts();

const SellerDashboard = () => {
  const { seller, logout } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const urlTab = location.pathname.split('/seller/')[1];
  const currentTab = TAB_KEYS.includes(urlTab) ? urlTab : 'overview';

  const [tab, setTab] = useState(currentTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sellerProducts, setSellerProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [commerce, setCommerce] = useState({
    orders: [],
    wallet: null,
    transactions: [],
    withdrawals: [],
    escrow: [],
  });
  const [commerceTick, setCommerceTick] = useState(0);

  useEffect(() => {
    getSellerProducts().then((data) => {
      setSellerProducts(data);
      setDataLoading(false);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [ordersRes, walletRes, txRes, withdrawalsRes, escrowRes] = await Promise.all([
        ordersApi.list({ page: 1, limit: 100, scope: 'seller' }).catch(() => ({ items: [] })),
        walletApi.me().catch(() => null),
        walletApi.transactions({ page: 1, limit: 50 }).catch(() => ({ items: [] })),
        withdrawalsApi.list({ page: 1, limit: 50 }).catch(() => ({ items: [] })),
        escrowApi.list({ page: 1, limit: 50 }).catch(() => ({ items: [] })),
      ]);
      if (!alive) return;
      setCommerce({
        orders: ordersRes.items || [],
        wallet: walletRes,
        transactions: txRes.items || [],
        withdrawals: withdrawalsRes.items || [],
        escrow: escrowRes.items || [],
      });
    })();
    return () => { alive = false; };
  }, [commerceTick]);

  useEffect(() => {
    setTab(currentTab);
  }, [currentTab]);

  const mock = useMemo(
    () => getSellerMockData(sellerProducts.length > 0 ? sellerProducts : allProducts),
    [sellerProducts]
  );

  const refreshCommerce = () => setCommerceTick((t) => t + 1);

  const overviewOrders = commerce.orders.length
    ? commerce.orders.map((o) => ({
      id: o.id,
      customer: 'Buyer',
      product: o.product?.title,
      productImg: o.product?.img,
      amount: o.amount,
      date: o.date,
      status: o.status,
    }))
    : mock.orders;

  const changeTab = (key) => {
    setTab(key);
    navigate(`/seller/${key}`, { replace: true });
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const joinedDate = seller?.joinedAt
    ? new Date(seller.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : 'Recently';

  const renderSidebarContent = () => (
    <>
      <div className="mb-8">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary text-lg font-bold">
          {seller?.storeName?.charAt(0) || 'S'}
        </span>
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">Seller portal</p>
        <h2 className="mt-3 text-2xl font-black text-foreground">{seller?.storeName || 'Your Store'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{seller?.email}</p>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto pr-1">
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

      <div className="mt-8 border-t border-border pt-5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary transition-colors"
        >
          <LogOut className="h-4 w-4 text-primary" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo title="Seller Dashboard" description="Manage your HStock store, listings, and earnings." noIndex />

      <div className="relative lg:flex">
        <aside className="hidden lg:flex lg:w-[320px] shrink-0 flex-col border-r border-border bg-white px-6 py-8 shadow-sm">
          {renderSidebarContent()}
        </aside>

        <div className="flex-1">
          <div className="sticky top-0 z-20 border-b border-border bg-white lg:hidden">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-secondary text-foreground hover:bg-muted transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Seller</p>
                <p className="font-semibold text-foreground truncate max-w-[180px]">{seller?.storeName || 'Your Store'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex h-11 items-center rounded-3xl bg-secondary px-4 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div
              className={`absolute inset-0 bg-slate-900/20 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className={`absolute left-0 top-0 bottom-0 w-[88vw] max-w-[320px] bg-white p-6 shadow-2xl border-r border-border transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <div className="mb-8 flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-secondary text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderSidebarContent()}
            </aside>
          </div>

          <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 lg:px-10">
            <div className="mb-10 flex flex-col gap-6 rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Seller Dashboard</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">Manage your HStock seller portal</h1>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  View performance, publish new listings, and manage orders, wallet payouts, and store settings from one unified seller workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.2fr_auto]">
                <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{seller?.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Joined {joinedDate}</p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <Link
                    to="/seller/products/new"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>

            {dataLoading ? (
              <div className="rounded-[2rem] border border-border bg-white p-12 text-center text-sm text-muted-foreground shadow-sm">Loading your dashboard…</div>
            ) : (
              <div className="space-y-8">
                {tab === 'overview' && (
                  <SellerOverviewTab
                    products={sellerProducts}
                    orders={overviewOrders}
                    reviews={mock.reviews}
                    salesChart={mock.salesChart}
                    bestSelling={mock.bestSelling}
                    storeViews={1204}
                  />
                )}
                {tab === 'products' && <SellerProductsTab />}
                {tab === 'orders' && <SellerOrdersTab orders={commerce.orders} />}
                {tab === 'escrow' && (
                  <SellerEscrowTab escrowItems={commerce.escrow} />
                )}
                {tab === 'downloads' && <SellerDownloadsTab downloads={mock.downloads} />}
                {tab === 'earnings' && (
                  <SellerEarningsTab
                    wallet={commerce.wallet}
                    transactions={commerce.transactions}
                    withdrawals={commerce.withdrawals}
                    onRefresh={refreshCommerce}
                  />
                )}
                {tab === 'analytics' && (
                  <SellerAnalyticsTab orders={overviewOrders} salesChart={mock.salesChart} bestSelling={mock.bestSelling} topCategories={mock.topCategories} storeViews={1204} />
                )}
                {tab === 'messages' && <SellerMessagesTab />}
                {tab === 'reviews' && <SellerReviewsTab reviews={mock.reviews} />}
                {tab === 'notifications' && <SellerNotificationsTab notifications={mock.notifications} />}
                {tab === 'store' && (
                  <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
                    <h3 className="font-bold text-foreground">Your public storefront</h3>
                    <p className="mt-2 text-sm text-muted-foreground">This is what buyers see when they visit your store page.</p>
                    <a
                      href={`/seller/${(seller?.storeName || 'your-store').toLowerCase().replace(/\s+/g, '-')}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <Store className="h-4 w-4" /> View storefront
                    </a>
                  </div>
                )}
                {tab === 'profile' && <SellerProfileTab seller={seller} productsCount={sellerProducts.length} joinedDate={joinedDate} />}
                {tab === 'settings' && <SellerStoreSettingsTab seller={seller} />}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
