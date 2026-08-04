import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Flame,
  ExternalLink,
  Megaphone,
  Shield,
  Gift,
  BadgeCheck,
  Calendar,
  ArrowUpRight,
  Store,
  Boxes,
  Users,
  Receipt,
  CircleDollarSign,
  Clock3,
  Ban,
  CheckCircle2,
  Send,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import StatusBadge from '../../../admin/components/StatusBadge';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const fmtDate = (iso) => (iso
  ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  : '—');

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'text-primary',
  hintTone = 'text-muted-foreground',
  bg = 'bg-primary/10',
}) {
  return (
    <div className="rounded-[1.35rem] border border-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${bg} ${tone}`}>
          {Icon ? <Icon className="h-4.5 w-4.5" /> : null}
        </span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-foreground">{value}</p>
      {hint ? <p className={`mt-1 text-xs font-medium ${hintTone}`}>{hint}</p> : null}
    </div>
  );
}

function ProductMiniRow({ item, meta, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-secondary">
        {item.img || item.thumbnail ? (
          <img src={item.img || item.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
      </div>
      <p className="shrink-0 text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function formatPromotionCountdown(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h ${minutes}m left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}

const SellerOverviewTab = ({
  seller,
  products = [],
  orders = [],
  stats,
  salesChart7 = [],
  salesChart30 = [],
  bestSelling = [],
  lowestStock = [],
  mostViewed = [],
  actionRequired = [],
  joinedDate,
  onPromote,
}) => {
  const [chartRange, setChartRange] = React.useState('7');
  const [promoStatus, setPromoStatus] = React.useState(null);
  const [nowTick, setNowTick] = React.useState(Date.now());
  const chartData = chartRange === '7' ? salesChart7 : salesChart30;
  const storeSlug = seller?.slug
    || (seller?.storeName || 'your-store').toLowerCase().replace(/\s+/g, '-');
  const storeUrl = `/seller/${storeSlug}`;
  const approved = String(seller?.status || '').toLowerCase() === 'approved';
  const recentOrders = orders.slice(0, 6);
  const noDisputes = (stats?.openDisputes || 0) === 0;

  React.useEffect(() => {
    let cancelled = false;
    import('../../../services/storePromotionApi')
      .then(({ storePromotionApi }) => storePromotionApi.getStatus())
      .then((data) => { if (!cancelled) setPromoStatus(data); })
      .catch(() => { if (!cancelled) setPromoStatus(null); });
    return () => { cancelled = true; };
  }, [seller?.id, seller?.storePromotedUntil]);

  React.useEffect(() => {
    if (!promoStatus?.activePromotion?.expiresAt) return undefined;
    const timer = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [promoStatus?.activePromotion?.expiresAt]);

  const activePromo = promoStatus?.activePromotion;
  const promoActive = Boolean(
    activePromo
    && activePromo.expiresAt
    && new Date(activePromo.expiresAt).getTime() > nowTick,
  );
  const promoCountdown = promoActive
    ? formatPromotionCountdown(activePromo.expiresAt)
    : null;

  return (
    <div className="space-y-6">
      {/* Profile + quick actions */}
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
        <div className="border-b border-border bg-gradient-to-br from-primary/[0.08] via-white to-accent/[0.06] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl brand-gradient text-white shadow-sm">
                <Store className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Seller Dashboard</p>
                <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {seller?.storeName || 'Your Store'}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                  }`}>
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {approved ? 'Approved store' : `Status: ${seller?.status || 'pending'}`}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {joinedDate || 'Recently'}
                  </span>
                  {promoActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                      <Megaphone className="h-3.5 w-3.5" />
                      Promoted · {promoCountdown}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => (typeof onPromote === 'function' ? onPromote() : null)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                    >
                      Get badge
                    </button>
                  )}
                </div>
                {promoActive ? (
                  <p className="mt-3 text-sm font-medium text-orange-700">
                    Featured Seller promotion active — expires {new Date(activePromo.expiresAt).toLocaleString()}.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[280px]">
              <Link
                to="/seller/products/new"
                className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-500 px-3 py-3 text-center text-xs font-bold text-white shadow-sm hover:bg-emerald-600"
              >
                <span className="text-lg leading-none">+</span>
                Add Product
              </Link>
              <button
                type="button"
                onClick={() => (typeof onPromote === 'function' ? onPromote() : null)}
                className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl bg-orange-500 px-3 py-3 text-center text-xs font-bold text-white shadow-sm hover:bg-orange-600"
              >
                <Megaphone className="h-4 w-4" />
                Promote
              </button>
              <Link
                to="/seller/analytics"
                className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-white px-3 py-3 text-center text-xs font-bold text-foreground shadow-sm hover:bg-secondary"
              >
                <TrendingUp className="h-4 w-4 text-primary" />
                Rank
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insurance</p>
            <p className="mt-1 text-sm font-bold text-foreground">$0.00 <span className="font-medium text-emerald-600">covered</span></p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referral</p>
            <p className="mt-1 text-sm font-bold text-foreground">Invite sellers & buyers</p>
          </div>
          {approved ? (
            <a
              href={storeUrl}
              className="inline-flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3 hover:bg-secondary"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">View store</p>
                <p className="mt-1 truncate text-sm font-bold text-foreground">/{storeSlug}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-primary" />
            </a>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Public store unlocks after approval.
            </div>
          )}
        </div>
      </section>

      {/* Withdrawable balance hero */}
      <section className="overflow-hidden rounded-[1.75rem] brand-gradient p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              <Wallet className="h-4 w-4" /> Withdrawable Balance
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {money(stats.withdrawableBalance)}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
              <span>Total balance {money(stats.availableBalance)}</span>
              <span>Net profit {money(stats.netProfit)}</span>
              <span>This month {money(stats.monthSales)}</span>
            </div>
          </div>
          <Link
            to="/seller/earnings"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary shadow-sm hover:bg-white/95"
          >
            <ArrowUpRight className="h-4 w-4" /> Withdraw
          </Link>
        </div>
      </section>

      {/* KPI grid */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricTile label="Total Sales" value={money(stats.grossSales)} hint={`+${money(stats.todaySales)} today`} icon={TrendingUp} hintTone="text-emerald-600" bg="bg-sky-50" tone="text-sky-600" />
        <MetricTile label="Net Profit" value={money(stats.netProfit)} hint="after fees & refunds" icon={CircleDollarSign} hintTone="text-emerald-600" bg="bg-emerald-50" tone="text-emerald-600" />
        <MetricTile label="Total Orders" value={stats.ordersCount} hint={`${stats.pendingOrders} in progress`} icon={ShoppingCart} hintTone="text-orange-600" bg="bg-orange-50" tone="text-orange-600" />
        <MetricTile label="Completed" value={stats.completedOrders} hint={`${stats.disputedOrders} disputed`} icon={CheckCircle2} bg="bg-violet-50" tone="text-violet-600" />
        <MetricTile label="Repeat Rate" value={`${stats.repeatRate}%`} hint={`${stats.repeatBuyers} regular buyers`} icon={Users} hintTone="text-violet-600" bg="bg-fuchsia-50" tone="text-fuchsia-600" />
        <MetricTile label="Avg Order" value={money(stats.avgOrderValue)} hint={`${money(stats.refundedAmount)} refunded`} icon={Receipt} hintTone="text-red-500" bg="bg-rose-50" tone="text-rose-600" />
        <MetricTile label="Live Products" value={stats.liveProducts} hint={`${stats.outOfStock} out of stock`} icon={Package} bg="bg-teal-50" tone="text-teal-600" />
        <MetricTile label="Inventory" value={stats.totalInventory} hint={`${stats.draftProducts} drafts`} icon={Boxes} bg="bg-indigo-50" tone="text-indigo-600" />
        <MetricTile
          label="Insurance / Refunded"
          value={money(stats.refundedAmount)}
          hint="all-time refunds"
          icon={Shield}
          bg="bg-slate-100"
          tone="text-slate-600"
        />
      </section>

      {/* Period sales + chart */}
      <section className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-foreground">Sales — last {chartRange} days</h3>
            <p className="mt-1 text-sm text-muted-foreground">Revenue and order volume from your live commerce data.</p>
          </div>
          <div className="inline-flex rounded-full border border-border bg-secondary/70 p-1">
            {['7', '30'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  chartRange === range ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-secondary/50 px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Today</p>
            <p className="mt-1 text-base font-black sm:text-lg">{money(stats.todaySales)}</p>
          </div>
          <div className="rounded-2xl bg-secondary/50 px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">This week</p>
            <p className="mt-1 text-base font-black sm:text-lg">{money(stats.weekSales)}</p>
          </div>
          <div className="rounded-2xl bg-secondary/50 px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">This month</p>
            <p className="mt-1 text-base font-black sm:text-lg">{money(stats.monthSales)}</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="sellerDashSalesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value, name) => (
                  name === 'sales' ? [money(value), 'Sales'] : [value, 'Orders']
                )}
              />
              <Area type="monotone" dataKey="sales" stroke="#7C3AED" strokeWidth={2.5} fill="url(#sellerDashSalesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Action required */}
      <section className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-black text-foreground">Action Required</h3>
          {actionRequired.length > 0 ? (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
              {actionRequired.length}
            </span>
          ) : null}
        </div>
        {actionRequired.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-emerald-900">You're all caught up</p>
            <p className="mt-1 text-sm text-emerald-800/80">No inventory, dispute, or approval actions need attention.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actionRequired.map((action) => (
              <div
                key={action.id}
                className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                    {action.type === 'telegram' ? <Send className="h-4 w-4" />
                      : action.type === 'dispute' ? <Shield className="h-4 w-4" />
                        : action.type === 'delivery' ? <Clock3 className="h-4 w-4" />
                          : action.type === 'moderation' ? <Ban className="h-4 w-4" />
                            : <Package className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{action.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <Link
                  to={action.to}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  {action.cta}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top products + disputes */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 text-lg font-black">
              <Flame className="h-5 w-5 text-red-500" /> Top Selling Products
            </h3>
            <Link to="/seller/products" className="text-xs font-semibold text-primary hover:underline">Manage →</Link>
          </div>
          {bestSelling.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No sales yet. Publish a listing to start ranking products.</p>
          ) : (
            <div className="divide-y divide-border">
              {bestSelling.slice(0, 5).map((item) => (
                <ProductMiniRow
                  key={item.id}
                  item={item}
                  meta={`Sold: ${item.sales} · ${item.stock == null ? (item.deliveryType === 'manual' ? 'Manual' : '—') : `Stock: ${item.stock}`}`}
                  value={money(item.price ?? item.revenue)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              {noDisputes ? (
                <>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-foreground">No active disputes</p>
                </>
              ) : (
                <>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-foreground">{stats.openDisputes} active dispute{stats.openDisputes === 1 ? '' : 's'}</p>
                  <Link to="/seller/messages" className="mt-2 text-xs font-semibold text-primary hover:underline">Open disputes →</Link>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-black">Lowest Stock</h3>
              <Link to="/seller/products" className="text-xs font-semibold text-primary">View</Link>
            </div>
            {lowestStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tracked inventory products yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {lowestStock.slice(0, 4).map((item) => (
                  <ProductMiniRow
                    key={item.id}
                    item={item}
                    meta={`Stock: ${item.stock}`}
                    value={money(item.price)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Most viewed + recent orders */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-black">Most Viewed</h3>
            <Link to="/seller/analytics" className="text-xs font-semibold text-primary">Analytics →</Link>
          </div>
          {mostViewed.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Views will appear as buyers browse your listings.</p>
          ) : (
            <div className="divide-y divide-border">
              {mostViewed.slice(0, 5).map((item) => (
                <ProductMiniRow
                  key={item.id}
                  item={item}
                  meta={`${item.views} views · ${item.sold} sold`}
                  value={money(item.price)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="inline-flex items-center gap-2 text-lg font-black">
              <ShoppingCart className="h-5 w-5 text-emerald-600" /> Recent Orders
            </h3>
            <Link to="/seller/orders" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-3.5">
                        <p className="font-black text-foreground">{money(order.amount)}</p>
                        <p className="mt-0.5 max-w-[160px] truncate text-xs text-muted-foreground">{order.product}</p>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(order.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/seller/products', label: 'Products', icon: Package, hint: `${stats.liveProducts} live` },
          { to: '/seller/orders', label: 'Orders', icon: ShoppingCart, hint: `${stats.pendingOrders} pending` },
          { to: '/seller/earnings', label: 'Withdraw', icon: Wallet, hint: money(stats.withdrawableBalance) },
          { to: '/seller/settings', label: 'Store settings', icon: Gift, hint: 'Profile & Telegram' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-[1.35rem] border border-border bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
          >
            <item.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-bold text-foreground">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default SellerOverviewTab;
