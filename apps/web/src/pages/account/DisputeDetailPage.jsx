import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import { NetworkErrorState } from '../../components/ErrorState';
import DisputeChat from '../../components/disputes/DisputeChat';
import DisputeTimeline from '../../components/disputes/DisputeTimeline';
import PartialDisputeSummary from '../../components/disputes/PartialDisputeSummary';
import ReplacementPanel from '../../components/disputes/ReplacementPanel';
import { disputesApi } from '../../services/disputesApi';
import { useStore } from '../../context/StoreContext';

const DisputeDetailPage = () => {
  const { id } = useParams();
  const { user } = useStore();
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
      <AccountLayout title="Dispute">
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dispute…
        </div>
      </AccountLayout>
    );
  }

  if (error) {
    return (
      <AccountLayout title="Dispute">
        <NetworkErrorState onRetry={load} message={error.message} />
      </AccountLayout>
    );
  }

  if (!dispute) {
    return (
      <AccountLayout title="Dispute">
        <div className="py-16 text-center">
          <p className="mb-6 text-muted-foreground">Dispute not found.</p>
          <Link to="/disputes" className="rounded-full brand-gradient px-6 py-3 font-semibold text-white">Back to disputes</Link>
        </div>
      </AccountLayout>
    );
  }

  const readOnly = dispute.chatReadOnly || ['resolved', 'closed'].includes(dispute.status);
  const quantities = dashboard?.quantities || {};
  const amounts = dashboard?.amounts || {};

  return (
    <>
      <Seo title={`Dispute ${dispute.disputeNumber}`} description="Dispute details, chat, and replacements." noIndex />
      <AccountLayout
        title={dispute.disputeNumber}
        subtitle={`${dispute.productTitle} · ${dispute.statusLabel}`}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {['overview', 'chat', 'replacements', 'timeline'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${tab === key ? 'brand-gradient text-white' : 'border border-border bg-white hover:bg-secondary'}`}
              >
                {key}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{dispute.reason}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{dispute.description}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{dispute.statusLabel}</span>
              </div>
              {(dashboard?.ocrFlags > 0) && (
                <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  OCR review flag on evidence ({dashboard.ocrFlags})
                </p>
              )}
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

            {dispute.evidenceUrls?.length > 0 && (
              <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
                <h3 className="mb-3 font-bold">Evidence</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {dispute.evidenceUrls.map((url, i) => (
                    <li key={`${url}-${i}`}>
                      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-border">
                        <img src={url} alt={`Evidence ${i + 1}`} className="aspect-video w-full object-cover bg-secondary" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dispute.orderId && (
              <Link to={`/orders/${dispute.orderNumber || dispute.orderId}`} className="inline-flex text-sm font-semibold text-primary hover:underline">
                View related order
              </Link>
            )}
          </div>
        )}

        {tab === 'chat' && (
          <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
            <DisputeChat
              disputeId={dispute.id}
              readOnly={readOnly}
              currentUserId={user?.id || user?._id}
            />
          </div>
        )}

        {tab === 'replacements' && (
          <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
            <ReplacementPanel
              disputeId={dispute.id}
              replacements={replacements}
              role="buyer"
              readOnly={readOnly}
              onChanged={load}
            />
          </div>
        )}

        {tab === 'timeline' && (
          <div className="rounded-3xl border border-border bg-white p-5 soft-shadow">
            <h3 className="mb-4 font-bold">Dispute timeline</h3>
            <DisputeTimeline events={timeline} />
          </div>
        )}
      </AccountLayout>
    </>
  );
};

export default DisputeDetailPage;
