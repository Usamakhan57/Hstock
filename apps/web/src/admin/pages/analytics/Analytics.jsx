import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { getOrders } from '../../api/orders';
import { getProducts } from '../../api/products';
import { getCategories } from '../../api/categories';
import { getCustomers } from '../../api/customers';

const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtMonth = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short' });

const STATUS_COLORS = {
  pending: '#F59E0B', processing: '#3B82F6', shipped: '#6366F1',
  completed: '#10B981', cancelled: '#EF4444',
};

const Analytics = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getProducts(), getCategories(), getCustomers()]).then(([o, p, c, cu]) => {
      setOrders(o); setProducts(p); setCategories(c); setCustomers(cu);
      setLoading(false);
    });
  }, []);

  const revenue = useMemo(() => orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0), [orders]);
  const aov = useMemo(() => (orders.length ? revenue / orders.length : 0), [orders, revenue]);

  const revenueByMonth = useMemo(() => {
    const byMonth = {};
    orders.forEach((o) => {
      const m = fmtMonth(o.createdAt);
      byMonth[m] = (byMonth[m] || 0) + o.total;
    });
    return Object.entries(byMonth).map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const counts = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [orders]);

  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.downloads - a.downloads).slice(0, 6)
      .map((p) => ({ name: p.title.length > 18 ? `${p.title.slice(0, 18)}…` : p.title, downloads: p.downloads })),
    [products],
  );

  const categoryPerformance = useMemo(() => {
    const revenueByCategory = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;
        const cat = categories.find((c) => c.id === product.categoryId);
        const name = cat?.name || 'Uncategorized';
        revenueByCategory[name] = (revenueByCategory[name] || 0) + item.price * item.qty;
      });
    });
    return Object.entries(revenueByCategory)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [orders, products, categories]);

  return (
    <div>
      <PageHeader title="Analytics" description="Store performance across sales, products, and customers." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={fmtMoney(revenue)} icon={DollarSign} trend={12.4} />
        <StatCard label="Avg. Order Value" value={fmtMoney(aov)} icon={TrendingUp} trend={3.2} />
        <StatCard label="Total Orders" value={orders.length} icon={ShoppingCart} trend={8.1} />
        <StatCard label="Customers" value={customers.length} icon={Users} trend={4.3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 soft-shadow">
          <h2 className="font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64">
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByMonth} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="analyticsRevFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C3BFF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6C3BFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
                  <Area type="monotone" dataKey="total" stroke="#6C3BFF" strokeWidth={2} fill="url(#analyticsRevFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 soft-shadow">
          <h2 className="font-semibold mb-4">Orders by Status</h2>
          <div className="h-64">
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {ordersByStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5 soft-shadow">
          <h2 className="font-semibold mb-4">Top Products by Downloads</h2>
          <div className="h-72">
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEE" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={140} />
                  <Tooltip />
                  <Bar dataKey="downloads" fill="#6C3BFF" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 soft-shadow">
          <h2 className="font-semibold mb-4">Revenue by Category</h2>
          <div className="h-72">
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
                  <Bar dataKey="total" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
