import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Wallet, Eye, Download, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from '../../../admin/components/StatCard';
import StatusBadge from '../../../admin/components/StatusBadge';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const RatingStars = ({ value }) => (
  <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`text-xs ${n <= value ? 'text-amber-400' : 'text-border'}`}>★</span>)}
  </span>
);

const SellerOverviewTab = ({ products, orders, reviews, salesChart, bestSelling, storeViews }) => {
  const lifetimeEarnings = orders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.amount, 0);
  const recentOrders = orders.slice(0, 5);
  const latestReviews = reviews.slice(0, 3);
  const liveListings = products.filter((p) => p.status === 'live' || p.status === 'active').length;

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Listings" value={products.length} icon={Package} />
        <StatCard label="Orders" value={orders.length} icon={ShoppingCart} trend={8} />
        <StatCard label="Lifetime Earnings" value={`$${lifetimeEarnings.toFixed(2)}`} icon={Wallet} trend={12} />
        <StatCard label="Store Views (30d)" value={storeViews} icon={Eye} trend={-3} trendLabel="vs last month" />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Performance overview</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.23em] text-primary">Live</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="sellerSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C3BFF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6C3BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`$${v}`, 'Sales']} />
                <Area type="monotone" dataKey="sales" stroke="#6C3BFF" strokeWidth={2} fill="url(#sellerSalesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Listing highlights</h3>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="rounded-2xl bg-primary/[0.06] p-4">
            <p className="text-sm font-semibold">{liveListings} listings are currently live</p>
            <p className="mt-1 text-sm text-muted-foreground">Keep titles clear, stock accurate, and delivery options up to date to improve conversion.</p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border p-3">Verified handover and instant delivery options appear on storefront cards.</div>
            <div className="rounded-2xl border border-border p-3">Your seller profile reflects real stock and delivery windows for buyers.</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="font-bold">Recent orders</h3>
            <Link to="/seller/orders" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{o.product}</p>
                        <p className="text-xs text-muted-foreground">{o.customer} · {fmtDate(o.date)}</p>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">${Number(o.amount || 0).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Latest reviews</h3>
            <Link to="/seller/reviews" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          {latestReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet. Reviews will appear here when buyers leave feedback.</p>
          ) : (
            <ul className="space-y-4">
              {latestReviews.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.product}</span>
                    <RatingStars value={r.rating} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">"{r.text}"</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOverviewTab;
