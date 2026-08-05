import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Seo from '../../../components/Seo';
import DisputeChat from '../../../components/disputes/DisputeChat';
import DisputeTimeline from '../../../components/disputes/DisputeTimeline';
import PartialDisputeSummary from '../../../components/disputes/PartialDisputeSummary';
import ReplacementPanel from '../../../components/disputes/ReplacementPanel';
import { NetworkErrorState } from '../../../components/ErrorState';
import { disputesApi } from '../../../services/disputesApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';

const SellerDisputeDetail = () => {
  const { id } = useParams();
  const { seller } = useSellerAuth();
  const [dispute, setDispute] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [d, dash, tl, reps] = await Promise.all([
        disputesApi.get(id),
        disputesApi.dashboard(id).catch(() => null),
        disputesApi.timeline(id).catch(() => ({ items: [] })),
        disputesApi.listReplacements(id).catch(() => ({ items: [] })),
      ]);
      setDispute(d);
      setDashboard(dash);
      setTimeline(tl.items?.length ? tl.items : (dash?.timeline || []));
      setReplacements(reps.items?.length ? reps.items : (dash?.replacementHistory || []));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[2rem] border border-border bg-white p-16 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading dispute…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <NetworkErrorState onRetry={load} message={error.message} />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="rounded-[2rem] border border-border bg-white p-10 text-center shadow-sm">
        <p className="mb-4 text-muted-foreground">Dispute not found.</p>
        <Link to="/seller/messages" className="text-sm font-semibold text-primary hover:underline">Back to disputes</Link>
      </div>
    );
  }

  const readOnly = dispute.chatReadOnly || ['resolved', 'closed'].includes(dispute.status);
  const quantities = dashboard?.quantities || {};
  const amounts = dashboard?.amounts || {};

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <Seo title={`Dispute ${dispute.disputeNumber}`} description="Seller dispute workspace." noIndex />
      <div className="mx-auto max-w-[1080px] space-y-5">
      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <Link to="/seller/messages" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Disputes
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">{dispute.disputeNumber}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{dispute.productTitle} · {dispute.statusLabel}</p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['overview', 'chat', 'replacements', 'timeline'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${tab === key ? 'bg-primary text-white' : 'border border-border bg-white hover:bg-secondary'}`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">{dispute.reason}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{dispute.description}</p>
          </div>
          <PartialDisputeSummary
            orderQuantity={quantities.order || dispute.orderQuantity}
            disputedQuantity={quantities.disputed || dispute.disputedQuantity}
            remainingQuantity={quantities.remaining ?? dispute.remainingQuantity}
            disputedAmount={amounts.disputed || dispute.disputedAmount}
            heldAmount={amounts.held || dispute.disputedAmount}
            undisputedAmount={amounts.undisputed || 0}
            isPartial={dispute.isPartial}
          />
        </div>
      )}

      {tab === 'chat' && (
        <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
          <DisputeChat
            disputeId={dispute.id}
            readOnly={readOnly}
            currentUserId={seller?.id || seller?.userId || seller?._id}
          />
        </div>
      )}

      {tab === 'replacements' && (
        <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
          <ReplacementPanel
            disputeId={dispute.id}
            replacements={replacements}
            role="seller"
            readOnly={readOnly}
            onChanged={load}
            replacementAttempts={dashboard?.replacementAttempts ?? dispute.replacementAttempts}
            maxReplacementAttempts={dashboard?.maxReplacementAttempts ?? dispute.maxReplacementAttempts}
            canReplace={dashboard?.canReplace}
            disputeStatus={dispute.status}
          />
        </div>
      )}

      {tab === 'timeline' && (
        <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold">Dispute timeline</h3>
          <DisputeTimeline events={timeline} />
        </div>
      )}
      </div>
    </div>
  );
};

export default SellerDisputeDetail;
