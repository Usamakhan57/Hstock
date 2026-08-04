import React, { useState } from 'react';
import {
  ShoppingCart,
  Percent,
  Download,
  TrendingUp,
  CircleDollarSign,
  Package,
  Users,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#7C3AED', '#FF7A59', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899'];
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const SellerAnalyticsTab = ({
  orders = [],
  salesChart = [],
  salesChart7 = [],
  bestSelling = [],
  topCategories = [],
  stats = {},
}) => {
  const [range, setRange] = useState('30');
  const chart = range === '7' ? (salesChart7?.length ? salesChart7 : salesChart.slice(-7)) : salesChart;
  const totalSales = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'expired').length;
  const totalDownloads = bestSelling.reduce((s, p) => s + (p.downloads || 0), 0);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Gross Sales', value: money(stats.grossSales), icon: CircleDollarSign },
          { label: 'Net Profit', value: money(stats.netProfit), icon: TrendingUp },
          { label: 'Orders', value: totalSales, icon: ShoppingCart },
          { label: 'AOV', value: money(stats.avgOrderValue), icon: Receipt },
          { label: 'Repeat Rate', value: `${stats.repeatRate || 0}%`, icon: Percent },
          { label: 'Live Products', value: stats.liveProducts || 0, icon: Package },
          { label: 'Repeat Buyers', value: stats.repeatBuyers || 0, icon: Users },
          { label: 'Units Sold', value: totalDownloads, icon: Download },
        ].map((card) => (
          <div key={card.label} className="relative z-0 min-w-0 rounded-[1.35rem] border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <card.icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 break-words text-2xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="relative z-0 min-w-0 rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-black">Revenue & orders</h3>
            <div className="inline-flex shrink-0 rounded-full border border-border bg-secondary/70 p-1">
              {['7', '30'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    range === value ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {value}d
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-64 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <AreaChart data={chart} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="sellerAnalyticsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(v, name) => (name === 'sales' ? [money(v), 'Sales'] : [v, 'Orders'])} />
                <Area type="monotone" dataKey="sales" stroke="#7C3AED" strokeWidth={2.5} fill="url(#sellerAnalyticsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative z-0 min-w-0 rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 font-black">Top categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No category data yet.</p>
          ) : (
            <>
              <div className="relative h-40 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
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
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="shrink-0 text-muted-foreground">{c.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="relative z-0 min-w-0 rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 font-black">Orders by day</h3>
          <div className="relative h-56 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={chart} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip />
                <Bar dataKey="orders" fill="#EC4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative z-0 min-w-0 rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black">Best performing listings</h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> Trending
            </span>
          </div>
          {bestSelling.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {bestSelling.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <img src={p.img || p.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover bg-secondary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.cat || 'Listing'} · {money(p.revenue)}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Download className="h-3.5 w-3.5" /> {(p.downloads || 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerAnalyticsTab;
