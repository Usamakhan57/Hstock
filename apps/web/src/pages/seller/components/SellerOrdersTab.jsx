import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Download, ShoppingCart, Search, Truck, Loader2 } from 'lucide-react';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../components/ui/dialog';
import { useToast } from '../../../hooks/use-toast';
import { ordersApi } from '../../../services/ordersApi';
import { canSellerDeliverOrder, getDeliveryLabel } from '../lib/sellerDelivery';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const fmtDate = (iso) => (iso
  ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const ORDER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'escrow', label: 'Escrow' },
  { key: 'completed', label: 'Completed' },
  { key: 'refunded', label: 'Refunded' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'disputed', label: 'Disputed' },
];

const EMPTY_CREDENTIALS = {
  email: '',
  username: '',
  password: '',
  note: '',
};

const SellerOrdersTab = ({ orders = [], onRefresh }) => {
  const { toast } = useToast();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [deliverOrder, setDeliverOrder] = useState(null);
  const [credentials, setCredentials] = useState(EMPTY_CREDENTIALS);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let rows = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((o) => (
        String(o.id || '').toLowerCase().includes(q)
        || String(o.product?.title || '').toLowerCase().includes(q)
        || String(o.buyer?.email || o.buyer?.name || '').toLowerCase().includes(q)
        || String(o.paymentStatusLabel || '').toLowerCase().includes(q)
        || String(o.escrowStatusLabel || '').toLowerCase().includes(q)
      ));
    }
    return rows;
  }, [orders, tab, query]);

  const openDeliverModal = (order) => {
    setDeliverOrder(order);
    setCredentials(EMPTY_CREDENTIALS);
  };

  const closeDeliverModal = () => {
    if (submitting) return;
    setDeliverOrder(null);
    setCredentials(EMPTY_CREDENTIALS);
  };

  const handleDeliverSubmit = async (event) => {
    event.preventDefault();
    if (!deliverOrder) return;

    const fields = Object.fromEntries(
      Object.entries(credentials).filter(([, value]) => String(value || '').trim()),
    );
    if (!Object.keys(fields).length) {
      toast({
        title: 'Account details required',
        description: 'Enter at least one credential field for the buyer.',
        variant: 'destructive',
      });
      return;
    }

    const orderRef = deliverOrder._id || deliverOrder.id;
    setSubmitting(true);
    try {
      await ordersApi.deliver(orderRef, {
        accounts: [{ fields }],
        message: fields.note || undefined,
      });
      toast({
        title: 'Order delivered',
        description: `${deliverOrder.id || 'Order'} marked delivered. Buyer inspection window started.`,
      });
      setDeliverOrder(null);
      setCredentials(EMPTY_CREDENTIALS);
      if (typeof onRefresh === 'function') {
        await onRefresh({ force: true });
      }
    } catch (err) {
      toast({
        title: 'Could not deliver order',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Recent Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">{orders.length} total seller orders</p>
        </div>
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order, buyer, or product…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto border-b border-border pb-1">
        {ORDER_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders here" description="Orders matching this status will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Buyer</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Delivery</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Escrow</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => {
                  const showDeliver = canSellerDeliverOrder(o);
                  return (
                    <tr key={o.id} className="hover:bg-secondary/30">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-primary">{o.id}</p>
                        <p className="mt-0.5 max-w-[180px] truncate text-xs text-muted-foreground">{o.product?.title}</p>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {o.buyer?.email || o.buyer?.name || 'Buyer'}
                      </td>
                      <td className="px-5 py-3.5 font-black">{money(o.amount)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(o.date)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {o.deliveryStatusLabel
                          || o.deliveryStatus
                          || getDeliveryLabel(o.product?.deliveryType || o.deliveryType)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{o.paymentStatusLabel || '—'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{o.escrowStatusLabel || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {showDeliver ? (
                            <button
                              type="button"
                              onClick={() => openDeliverModal(o)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                              data-testid="seller-deliver-order"
                              title="Deliver Order"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              Deliver Order
                            </button>
                          ) : null}
                          <Link
                            to={`/orders/${o.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary"
                            title="View order"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {['completed', 'escrow', 'delivered', 'disputed'].includes(o.status) ? (
                            <Link
                              to={`/orders/${o.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary"
                              title="Download / delivery"
                            >
                              <Download className="h-4 w-4" />
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(deliverOrder)} onOpenChange={(open) => (!open ? closeDeliverModal() : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Deliver Order</DialogTitle>
            <DialogDescription>
              Send account details for {deliverOrder?.id || 'this order'}. The buyer will see them immediately and the 24-hour inspection timer will start.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeliverSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">
                Email / login
                <input
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="buyer@example.com"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm font-medium">
                Username
                <input
                  value={credentials.username}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="optional"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="••••••••"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                Notes / extra details
                <textarea
                  value={credentials.note}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, note: e.target.value }))}
                  className="mt-1.5 min-h-[88px] w-full rounded-2xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="2FA codes, recovery email, instructions…"
                />
              </label>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={closeDeliverModal}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                Submit delivery
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrdersTab;
