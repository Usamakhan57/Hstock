import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { getCustomer } from '../../api/customers';
import { getOrders } from '../../api/orders';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const CustomerDetail = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomer(id), getOrders()]).then(([c, allOrders]) => {
      setCustomer(c);
      setOrders(allOrders.filter((o) => o.customerId === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!customer) return <p className="text-sm text-muted-foreground">Customer not found.</p>;

  return (
    <div>
      <PageHeader title={customer.name} backTo="/admin/customers" backLabel="Customers" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Order History</h3>
            <span className="text-xs text-muted-foreground">{orders.length} orders</span>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground p-5">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="font-medium px-5 py-3">Order</th>
                  <th className="font-medium px-5 py-3">Date</th>
                  <th className="font-medium px-5 py-3">Status</th>
                  <th className="font-medium px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-5 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium text-primary">#{o.id.replace('ord-', '')}</Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{fmtDate(o.createdAt)}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-right font-medium">${o.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-sm">Profile</h3>
          <div className="text-sm space-y-2">
            <p><span className="text-muted-foreground">Email:</span> {customer.email}</p>
            <p><span className="text-muted-foreground">Phone:</span> {customer.phone || '—'}</p>
            <p><span className="text-muted-foreground">Joined:</span> {fmtDate(customer.joinedAt)}</p>
            <p><span className="text-muted-foreground">Total spent:</span> ${customer.totalSpent.toFixed(2)}</p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-muted-foreground text-sm">Status:</span>
              <StatusBadge status={customer.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
