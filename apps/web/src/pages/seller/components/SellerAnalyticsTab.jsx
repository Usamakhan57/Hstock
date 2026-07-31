import React from 'react';
import { Eye, ShoppingCart, Percent, Download, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../../../admin/components/StatCard';

const COLORS = ['#6C3BFF', '#FF7A59', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899'];

const SellerAnalyticsTab = ({ orders, salesChart, bestSelling, topCategories, storeViews }) => {
  const totalSales = orders.filter((o) => o.status !== 'cancelled').length;
  const conversionRate = storeViews > 0 ? ((totalSales / storeViews) * 100).toFixed(1) : '0.0';
  const totalDownloads = bestSelling.reduce((s, p) => s + (p.downloads || 0), 0);

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visitors (30d)" value={storeViews.toLocaleString()} icon={Eye} trend={5} />
        <StatCard label="Sales (30d)" value={totalSales} icon={ShoppingCart} trend={7} />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={Percent} trend={1.2} />
        <StatCard label="Downloads" value={totalDownloads.toLocaleString()} icon={Download} trend={4} />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Traffic and sales trend</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.23em] text-primary">30d</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="sellerAnalyticsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C3BFF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6C3BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`$${v}`, 'Sales']} />
                <Area type="monotone" dataKey="sales" stroke="#6C3BFF" strokeWidth={2} fill="url(#sellerAnalyticsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <h3 className="font-bold mb-4">Top categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No category data yet.</p>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topCategories} dataKey="count" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                      {topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {topCategories.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Best performing listings</h3>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><TrendingUp className="h-3.5 w-3.5" /> Trending</span>
        </div>
        {bestSelling.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales data yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {bestSelling.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <img src={p.img || p.thumbnail} alt={p.title} className="h-10 w-10 shrink-0 rounded-lg object-cover bg-secondary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.cat}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground shrink-0"><Download className="h-3.5 w-3.5" /> {(p.downloads || 0).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SellerAnalyticsTab;
