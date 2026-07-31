import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductDetailSkeleton } from '../../components/Skeletons';
import DisputeEvidenceUpload from '../../components/disputes/DisputeEvidenceUpload';
import PartialDisputeSummary from '../../components/disputes/PartialDisputeSummary';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/use-toast';
import { ordersApi } from '../../services/ordersApi';
import { disputesApi } from '../../services/disputesApi';
import { ORDER_STATUS } from '../../constants/commerce';

const REASONS = [
  'Account not working',
  'Wrong credentials',
  'Account already sold / claimed',
  'Missing features described',
  'Partial delivery issue',
  'Other',
];

const DISPUTABLE = new Set([ORDER_STATUS.PAID, ORDER_STATUS.ESCROW, ORDER_STATUS.DELIVERED]);

const OpenDisputePage = () => {
  const { orderId: orderIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const orderRef = orderIdParam || searchParams.get('order');
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: order, loading, error, retry } = useFetch(
    () => (orderRef ? ordersApi.get(orderRef) : Promise.resolve(null)),
    [orderRef],
  );

  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [quantityMode, setQuantityMode] = useState('accounts');
  const [disputedQuantity, setDisputedQuantity] = useState(1);
  const [evidence, setEvidence] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const accounts = useMemo(() => {
    const raw = order?.accounts || order?.raw?.accounts || [];
    return Array.isArray(raw) ? raw : [];
  }, [order]);

  const orderQuantity = order?.quantity || accounts.length || 1;

  const effectiveQuantity = quantityMode === 'accounts' && selectedAccounts.length
    ? selectedAccounts.length
    : Math.min(Math.max(1, Number(disputedQuantity) || 1), orderQuantity);

  const remainingQuantity = Math.max(0, orderQuantity - effectiveQuantity);
  const unitPrice = Number(order?.unitPrice || (order?.amount && orderQuantity ? order.amount / orderQuantity : 0));
  const disputedAmount = unitPrice * effectiveQuantity;
  const isPartial = effectiveQuantity < orderQuantity;

  const toggleAccount = (id) => {
    setSelectedAccounts((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  if (loading) {
    return (
      <AccountLayout title="Open Dispute">
        <ProductDetailSkeleton />
      </AccountLayout>
    );
  }

  if (error) {
    return (
      <AccountLayout title="Open Dispute">
        <NetworkErrorState onRetry={retry} message={error.message} />
      </AccountLayout>
    );
  }

  if (!order) {
    return (
      <AccountLayout title="Open Dispute">
        <div className="py-16 text-center">
          <p className="mb-6 text-muted-foreground">Order not found.</p>
          <Link to="/orders" className="rounded-full brand-gradient px-6 py-3 font-semibold text-white">Back to Orders</Link>
        </div>
      </AccountLayout>
    );
  }

  const canDispute = DISPUTABLE.has(order.status) && !order.disputeOpen;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canDispute || submitting) return;

    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (finalReason.length < 3) {
      toast({ title: 'Reason required', description: 'Please provide a dispute reason.', variant: 'destructive' });
      return;
    }
    if (description.trim().length < 10) {
      toast({ title: 'Description too short', description: 'Add at least 10 characters describing the issue.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        orderId: order._id || order.raw?._id || order.id,
        reason: finalReason,
        description: description.trim(),
        evidence: evidence.map((f) => f.url).filter(Boolean),
      };
      if (quantityMode === 'accounts' && selectedAccounts.length) {
        payload.disputedAccountIds = selectedAccounts;
      } else if (effectiveQuantity < orderQuantity) {
        payload.disputedQuantity = effectiveQuantity;
      }

      const { dispute } = await disputesApi.open(payload);
      toast({ title: 'Dispute opened', description: `Case ${dispute.disputeNumber} is now under review.` });
      navigate(`/disputes/${dispute.id}`);
    } catch (err) {
      toast({ title: 'Could not open dispute', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Open Dispute" description="Open a dispute for your ApnaStore order." noIndex />
      <AccountLayout
        title="Open Dispute"
        subtitle={`Order ${order.id} · ${order.product?.title || 'Product'}`}
      >
        {!canDispute ? (
          <div className="rounded-3xl border border-border bg-white p-6 soft-shadow">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {order.disputeOpen
                ? 'A dispute already exists for this order.'
                : 'This order cannot be disputed in its current status.'}
            </p>
            <div className="mt-4 flex gap-3">
              <Link to={`/orders/${order.id}`} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">Back to order</Link>
              {order.disputeOpen && (
                <Link to="/disputes" className="rounded-full brand-gradient px-4 py-2 text-sm font-semibold text-white">View disputes</Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
              <h2 className="mb-4 font-bold">Affected accounts / quantity</h2>
              <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setQuantityMode('accounts')} className={`rounded-full px-4 py-2 text-xs font-semibold ${quantityMode === 'accounts' ? 'brand-gradient text-white' : 'border border-border'}`}>
                  Select accounts
                </button>
                <button type="button" onClick={() => setQuantityMode('quantity')} className={`rounded-full px-4 py-2 text-xs font-semibold ${quantityMode === 'quantity' ? 'brand-gradient text-white' : 'border border-border'}`}>
                  Set quantity
                </button>
              </div>

              {quantityMode === 'accounts' && accounts.length > 0 ? (
                <ul className="mb-4 space-y-2">
                  {accounts.map((account) => {
                    const id = account._id || account.id;
                    const checked = selectedAccounts.includes(id);
                    return (
                      <li key={id}>
                        <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${checked ? 'border-primary bg-primary/5' : 'border-border'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleAccount(id)} />
                          <span className="font-semibold">{account.label || account.identifier || `Account #${(account.index ?? 0) + 1}`}</span>
                          <span className="text-xs text-muted-foreground">{account.status || 'active'}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <label className="mb-4 block text-sm">
                  <span className="font-medium">Disputed quantity</span>
                  <input
                    type="number"
                    min={1}
                    max={orderQuantity}
                    value={disputedQuantity}
                    onChange={(e) => setDisputedQuantity(Number(e.target.value))}
                    className="mt-2 w-full max-w-[12rem] rounded-2xl border border-border bg-secondary/50 px-3 py-2 outline-none focus:border-primary"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">Order quantity: {orderQuantity}</span>
                </label>
              )}

              <PartialDisputeSummary
                orderQuantity={orderQuantity}
                disputedQuantity={effectiveQuantity}
                remainingQuantity={remainingQuantity}
                disputedAmount={disputedAmount}
                heldAmount={disputedAmount}
                undisputedAmount={unitPrice * remainingQuantity}
                isPartial={isPartial}
              />
            </div>

            <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
              <h2 className="mb-4 font-bold">Reason & description</h2>
              <label className="block text-sm font-medium">
                Dispute reason
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-secondary/50 px-3 py-2.5 outline-none focus:border-primary"
                >
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              {reason === 'Other' && (
                <input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe the reason"
                  className="mt-3 w-full rounded-2xl border border-border bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              )}
              <label className="mt-4 block text-sm font-medium">
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Explain what went wrong. Do not include passwords, emails, or phone numbers in free text."
                  className="mt-2 w-full rounded-2xl border border-border bg-secondary/50 px-3 py-2.5 outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
              <h2 className="mb-4 font-bold">Evidence</h2>
              <DisputeEvidenceUpload files={evidence} onChange={setEvidence} />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full brand-gradient px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit dispute
              </button>
              <Link to={`/orders/${order.id}`} className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary">Cancel</Link>
            </div>
          </form>
        )}
      </AccountLayout>
    </>
  );
};

export default OpenDisputePage;
