import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Undo2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getOrder, updateOrder } from '../../api/orders';
import { useToast } from '../../../hooks/use-toast';

const fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

const OrderDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getOrder(id).then((o) => { setOrder(o); setLoading(false); }); }, [id]);

  const handleStatusChange = async (field, value) => {
    setSaving(true);
    const updated = await updateOrder(id, { [field]: value });
    setOrder(updated);
    toast({ title: 'Order updated' });
    setSaving(false);
  };

  const handleRefund = async () => {
    setSaving(true);
    const updated = await updateOrder(id, { paymentStatus: 'refunded', status: 'cancelled' });
    setOrder(updated);
    toast({ title: 'Order refunded', description: `#${order.id.replace('ord-', '')}` });
    setSaving(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!order) return <p className="text-sm text-muted-foreground">Order not found.</p>;

  return (
    <div>
      <PageHeader
        title={`Order #${order.id.replace('ord-', '')}`}
        description={fmtDate(order.createdAt)}
        backTo="/admin/orders"
        backLabel="Orders"
        actions={
          order.paymentStatus === 'paid' && (
            <button
              onClick={handleRefund}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-60"
            >
              <Undo2 className="w-4 h-4" /> Refund
            </button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-sm">Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="font-medium px-5 py-3">Product</th>
                  <th className="font-medium px-5 py-3">License</th>
                  <th className="font-medium px-5 py-3 text-center">Qty</th>
                  <th className="font-medium px-5 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-5 py-3 font-medium">{item.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.licenseName}</td>
                    <td className="px-5 py-3 text-center">{item.qty}</td>
                    <td className="px-5 py-3 text-right">${item.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-5 py-3 text-right font-semibold">Total</td>
                  <td className="px-5 py-3 text-right font-bold">${order.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-sm">Status</h3>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Order Status</label>
              <Select value={order.status} onValueChange={(v) => handleStatusChange('status', v)} disabled={saving}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Payment Status</label>
              <Select value={order.paymentStatus} onValueChange={(v) => handleStatusChange('paymentStatus', v)} disabled={saving}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Payment method</span>
              <span className="font-medium text-foreground">{order.paymentMethod}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-sm">Customer</h3>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.email}</p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-sm">Escrow & Refund</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Escrow status</span>
              <span className="font-medium text-foreground">{order.escrowStatus || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Release at</span>
              <span className="font-medium text-foreground">{order.escrowReleaseAt ? fmtDate(order.escrowReleaseAt) : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Refund status</span>
              <span className="font-medium text-foreground">{order.refundStatus || 'none'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-sm">Timeline</h3>
            <ol className="space-y-2">
              {(order.timeline || []).map((step) => (
                <li key={step.key} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${step.done ? 'bg-primary' : 'bg-border'}`} />
                  <div>
                    <p className={`font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                    <p className="text-muted-foreground">{step.date ? fmtDate(step.date) : 'Pending'}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
