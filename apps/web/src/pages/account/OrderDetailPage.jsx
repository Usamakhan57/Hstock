import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, CircleDot, Circle, CreditCard, Truck, Loader2,
} from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import OrderDeliveryPanel from '../../components/OrderDeliveryPanel';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductDetailSkeleton } from '../../components/Skeletons';
import { useFetch } from '../../hooks/useFetch';
import { ordersApi } from '../../services/ordersApi';
import { paymentsApi } from '../../services/paymentsApi';
import { useToast } from '../../hooks/use-toast';
import { ORDER_STATUS, ESCROW_STATUS } from '../../constants/commerce';

const escrowStyle = {
  locked: 'bg-amber-100 text-amber-700',
  pending: 'bg-secondary text-foreground',
  released: 'bg-emerald-100 text-emerald-700',
  disputed: 'bg-red-100 text-red-700',
  refunded: 'bg-secondary text-muted-foreground',
};

const paymentStyle = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-secondary text-muted-foreground',
  cancelled: 'bg-secondary text-muted-foreground',
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { data: order, loading, error, retry } = useFetch(() => ordersApi.get(id), [id]);
  const [syncing, setSyncing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (loading) {
    return (
      <AccountLayout title="Order Details">
        <ProductDetailSkeleton />
      </AccountLayout>
    );
  }

  if (error) {
    return (
      <AccountLayout title="Order Details">
        <NetworkErrorState onRetry={retry} message={error.message} />
      </AccountLayout>
    );
  }

  if (!order) {
    return (
      <AccountLayout title="Order Not Found">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-6">We couldn't find that order.</p>
          <Link to="/orders" className="px-6 py-3 rounded-full brand-gradient text-white font-semibold">Back to Orders</Link>
        </div>
      </AccountLayout>
    );
  }

  const timeline = order.timeline || [];
  const escrowProgress = order.escrowStatus === ESCROW_STATUS.RELEASED
    ? 100
    : order.escrowStatus === ESCROW_STATUS.LOCKED || order.status === ORDER_STATUS.ESCROW
      ? 55
      : order.paymentStatus === 'paid'
        ? 40
        : 20;

  const handleSyncPayment = async () => {
    if (!order.paymentId || syncing) return;
    setSyncing(true);
    try {
      await paymentsApi.sync(order.paymentId);
      await retry();
      toast({ title: 'Payment synced', description: 'Latest Cryptomus status was fetched.' });
    } catch (err) {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(order.id, 'Cancelled by buyer');
      await retry();
      toast({ title: 'Order cancelled', description: 'Pending payment order was cancelled.' });
    } catch (err) {
      toast({ title: 'Cancel failed', description: err.message, variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Seo title={`Order ${order.id}`} description="View your ApnaStore order details, payment, and escrow." noIndex />
      <AccountLayout
        title={`Order ${order.id}`}
        subtitle={order.date ? new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
      >
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <div className="flex items-center gap-4">
                <Link to={order.product.id ? `/product/${order.product.id}` : '/shop'} className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary shrink-0">
                  {order.product.img ? <img src={order.product.img} alt={order.product.title} className="w-full h-full object-cover" /> : null}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={order.product.id ? `/product/${order.product.id}` : '/shop'} className="font-semibold hover:text-primary transition-colors line-clamp-1">{order.product.title}</Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {order.product.artist} · Qty {order.quantity}
                  </p>
                </div>
                <span className="font-black text-lg shrink-0">${order.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <h2 className="font-bold mb-5">Order Timeline</h2>
              <ol className="space-y-0">
                {timeline.map((step, i) => (
                  <li key={step.key || step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : order.disputeOpen ? (
                        <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                      ) : (
                        <CircleDot className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      {i < timeline.length - 1 && (
                        <span className={`w-px flex-1 min-h-[1.5rem] ${step.done ? 'bg-primary' : 'bg-border'}`} />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className={`text-sm font-semibold ${step.done ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                      {step.date && <p className="text-xs text-muted-foreground">{new Date(step.date).toLocaleString()}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <OrderDeliveryPanel
              orderId={order._id || order.id}
              deliveryStatus={order.deliveryStatus}
            />

            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <h2 className="font-bold mb-4">Order Status</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
                  <CreditCard className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentStyle[order.paymentStatus] || 'bg-secondary'}`}>
                      {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatusLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
                  <Truck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      order.deliveryStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-secondary'
                    }`}>
                      {order.deliveryStatus === 'delivered'
                        ? 'Delivered'
                        : order.deliveryStatus === 'awaiting_delivery'
                          ? 'Awaiting Delivery'
                          : (order.deliveryStatus || 'Pending')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Escrow</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${escrowStyle[order.escrowStatus] || 'bg-secondary'}`}>
                      {order.escrowStatus === 'locked' ? 'Held' : order.escrowStatusLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Escrow Progress</span>
                  <span>{escrowProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${order.escrowStatus === ESCROW_STATUS.DISPUTED ? 'bg-destructive' : 'brand-gradient'}`}
                    style={{ width: `${escrowProgress}%` }}
                  />
                </div>
                {order.escrowReleaseAt && order.escrowStatus === ESCROW_STATUS.LOCKED && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Auto-release scheduled: {new Date(order.escrowReleaseAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-border">
                {order.status === ORDER_STATUS.PENDING_PAYMENT && order.paymentUrl && (
                  <a href={order.paymentUrl} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95">
                    Continue Cryptomus Payment
                  </a>
                )}
                {order.paymentId && (
                  <button
                    type="button"
                    onClick={handleSyncPayment}
                    disabled={syncing}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary disabled:opacity-60"
                  >
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Sync Payment Status
                  </button>
                )}
                {(order.status === ORDER_STATUS.PENDING_PAYMENT || order.status === ORDER_STATUS.PAYMENT_PROCESSING) && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10 disabled:opacity-60"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {order.disputeOpen && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <AlertTriangle className="w-4 h-4" /> Dispute open for this order.
                  </p>
                  <Link
                    to={order.disputeId ? `/disputes/${order.disputeId}` : '/disputes'}
                    className="rounded-full border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    View dispute
                  </Link>
                </div>
              )}
              {!order.disputeOpen && [ORDER_STATUS.PAID, ORDER_STATUS.ESCROW, ORDER_STATUS.DELIVERED].includes(order.status) && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <Link
                    to={`/orders/${order.id}/dispute`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <AlertTriangle className="w-4 h-4" /> Open Dispute
                  </Link>
                </div>
              )}
              {order.escrowStatus === ESCROW_STATUS.RELEASED && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 mt-5 pt-5 border-t border-border">
                  <CheckCircle2 className="w-4 h-4" /> Order completed — escrow released to the seller.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <h2 className="font-bold mb-4">Payment summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">${order.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Platform fee</span><span className="font-semibold">${order.commissionAmount.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Seller amount</span><span className="font-semibold">${order.sellerAmount.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3 border-t border-border pt-3"><span className="font-semibold">You paid</span><span className="font-black">${order.amount.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </AccountLayout>
    </>
  );
};

export default OrderDetailPage;
