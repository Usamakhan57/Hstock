import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { getDashboard } from '../../api/adminOps';
import { getOrders } from '../../api/orders';
import { getCustomers } from '../../api/customers';
import { getInventory } from '../../api/inventory';
import { getProducts } from '../../api/products';
import { mapAdminOrder } from '../../api/adminMappers';

const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard().catch(() => null),
      getOrders().catch(() => []),
      getCustomers().catch(() => []),
      getInventory().catch(() => []),
      getProducts().catch(() => []),
    ]).then(([dash, o, c, i, p]) => {
      setDashboard(dash);
      setOrders(o);
      setCustomers(c);
      setInventory(i);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const stats = dashboard?.stats;
  const revenue = stats?.revenue30d ?? orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  const lowStock = useMemo(() => inventory.filter((i) => i.status !== 'in_stock'), [inventory]);

  const recentOrders = useMemo(() => {
    if (dashboard?.recentOrders?.length) {
      return dashboard.recentOrders.map((o) => mapAdminOrder(o));
    }
    return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  }, [dashboard, orders]);

  const chartData = useMemo(() => {
    if (dashboard?.revenueByDay?.length) {
      return dashboard.revenueByDay.map((row) => ({
        day: fmtDate(row.day),
        total: Math.round(Number(row.total || 0) * 100) / 100,
      }));
    }
    const byDay = {};
    orders.forEach((o) => {
      const day = fmtDate(o.createdAt);
      byDay[day] = (byDay[day] || 0) + o.total;
    });
    return Object.entries(byDay).map(([day, total]) => ({ day, total: Math.round(total * 100) / 100 }));
  }, [dashboard, orders]);

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your store's performance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={fmtMoney(revenue)} icon={DollarSign} trend={12.4} />
        <StatCard label="Total Orders" value={stats?.ordersTotal ?? orders.length} icon={ShoppingCart} trend={8.1} />
        <StatCard label="Customers" value={stats?.buyers ?? customers.length} icon={Users} trend={4.3} />
        <StatCard label="Products" value={stats?.productsTotal ?? products.length} icon={Package} trend={-1.2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 soft-shadow">
          <h2 className="font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C3BFF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6C3BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="total" stroke="#6C3BFF" strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 soft-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Low Stock Alerts</h2>
            <Link to="/admin/inventory" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.stock} in stock</p>
                  </div>
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${item.status === 'out_of_stock' ? 'text-red-500' : 'text-amber-500'}`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs font-semibold text-primary">View all</Link>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="font-medium px-5 py-3">Order</th>
                <th className="font-medium px-5 py-3">Customer</th>
                <th className="font-medium px-5 py-3">Date</th>
                <th className="font-medium px-5 py-3">Status</th>
                <th className="font-medium px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-primary">#{String(o.id).replace('ord-', '')}</Link>
                  </td>
                  <td className="px-5 py-3">{o.customerName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(o.createdAt)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-right font-medium">{fmtMoney(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
