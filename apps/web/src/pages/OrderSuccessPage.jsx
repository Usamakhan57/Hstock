import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { NetworkErrorState } from '../components/ErrorState';
import { ordersApi } from '../services/ordersApi';
import { paymentsApi } from '../services/paymentsApi';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/commerce';

const PAID_LIKE = new Set([
  ORDER_STATUS.PAID,
  ORDER_STATUS.ESCROW,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
]);

const FAILED_LIKE = new Set([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.EXPIRED,
  ORDER_STATUS.REFUNDED,
]);

const OrderSuccessPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderRef = params.get('order')
    || (typeof window !== 'undefined' ? sessionStorage.getItem('hs_pending_order') : null)
    || (typeof window !== 'undefined' ? sessionStorage.getItem('hs_pending_order_id') : null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);
  const attemptsRef = useRef(0);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!orderRef) {
      setLoading(false);
      setError(new Error('Missing order reference.'));
      return undefined;
    }

    let alive = true;
    attemptsRef.current = 0;
    syncedRef.current = false;
    setPolling(true);

    const tick = async () => {
      try {
        let next = await ordersApi.get(orderRef);
        if (!alive) return;

        if (
          next.paymentId
          && !syncedRef.current
          && next.paymentStatus !== PAYMENT_STATUS.PAID
          && !PAID_LIKE.has(next.status)
        ) {
          syncedRef.current = true;
          try {
            await paymentsApi.sync(next.paymentId);
            next = await ordersApi.get(orderRef);
          } catch {
            // sync is best-effort while webhook settles
          }
        }

        if (!alive) return;
        setOrder(next);
        setError(null);
        setLoading(false);

        if (
          FAILED_LIKE.has(next.status)
          || next.paymentStatus === PAYMENT_STATUS.FAILED
          || next.paymentStatus === PAYMENT_STATUS.EXPIRED
          || next.paymentStatus === PAYMENT_STATUS.CANCELLED
        ) {
          setPolling(false);
          navigate('/order-failed', {
            replace: true,
            state: { reason: next.paymentStatusLabel || 'Payment was not completed.', orderId: next.id },
          });
          return;
        }

        if (PAID_LIKE.has(next.status) || next.paymentStatus === PAYMENT_STATUS.PAID) {
          setPolling(false);
          sessionStorage.removeItem('hs_pending_order');
          sessionStorage.removeItem('hs_pending_order_id');
        }
      } catch (err) {
        if (!alive) return;
        setError(err);
        setLoading(false);
        attemptsRef.current += 1;
        if (attemptsRef.current >= 8) setPolling(false);
      }
    };

    tick();
    const interval = window.setInterval(() => {
      attemptsRef.current += 1;
      if (attemptsRef.current > 24) {
        setPolling(false);
        window.clearInterval(interval);
        return;
      }
      tick();
    }, 2500);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [orderRef, navigate]);

  const paid = order && (PAID_LIKE.has(order.status) || order.paymentStatus === PAYMENT_STATUS.PAID);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Payment Status" description="Your HStock payment status." noIndex />
      <Header />
      <main className="flex-1 mx-auto max-w-lg w-full px-5 py-20 text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <h1 className="text-2xl font-black tracking-tight">Verifying payment…</h1>
            <p className="text-muted-foreground">Waiting for Cryptomus webhook confirmation.</p>
          </div>
        ) : error && !order ? (
          <NetworkErrorState onRetry={() => window.location.reload()} message={error.message} />
        ) : (
          <>
            <span className={`grid place-items-center w-20 h-20 rounded-full mx-auto mb-6 ${paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {paid ? <CheckCircle2 className="w-9 h-9" /> : <Loader2 className="w-9 h-9 animate-spin" />}
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {paid ? 'Payment verified' : 'Payment pending'}
            </h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              {paid
                ? 'Your order is secured. Funds are held in escrow until release.'
                : 'Cryptomus is still confirming your payment. This page updates automatically.'}
            </p>

            {order && (
              <div className="mt-8 rounded-3xl border border-border bg-white p-5 text-left soft-shadow space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-semibold">{order.id}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold">{order.paymentStatusLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Escrow</span>
                  <span className="font-semibold">{order.escrowStatusLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-black">${order.amount.toFixed(2)}</span>
                </div>
                {!polling && !paid && (
                  <p className="text-xs text-amber-700 pt-2 border-t border-border">
                    Still waiting for confirmation. Open the order for the latest status or resume payment if the invoice is still valid.
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Escrow auto-release typically runs after 24 hours.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {order && (
                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:opacity-95"
                >
                  View order <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link to="/orders" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-border font-semibold hover:bg-secondary transition-colors">
                Order history
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
