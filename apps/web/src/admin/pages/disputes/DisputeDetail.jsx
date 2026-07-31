import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { getDispute, resolveDispute } from '../../api/disputes';
import { useToast } from '../../../hooks/use-toast';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const RESOLUTIONS = [
  { value: 'buyer_wins', label: 'Buyer Wins (Refund)' },
  { value: 'seller_wins', label: 'Seller Wins' },
  { value: 'release', label: 'Release Escrow' },
  { value: 'partial_refund', label: 'Partial Refund' },
];

const DisputeDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState('buyer_wins');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getDispute(id).then((d) => { setDispute(d); setLoading(false); });
  };

  useEffect(load, [id]);

  const handleResolve = async () => {
    setSaving(true);
    await resolveDispute(id, { resolution, note: note.trim() || undefined });
    toast({ title: 'Dispute resolved' });
    setSaving(false);
    load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!dispute) return <p className="text-sm text-muted-foreground">Dispute not found.</p>;

  const canResolve = !['resolved', 'closed'].includes(dispute.status);

  return (
    <div>
      <PageHeader
        title={`Dispute ${dispute.disputeNumber || dispute.id}`}
        description={fmtDate(dispute.createdAt)}
        backTo="/admin/disputes"
        backLabel="Disputes"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-sm">Overview</h3>
              <StatusBadge status={dispute.status} />
            </div>
            <p className="text-sm"><span className="text-muted-foreground">Order:</span> {dispute.orderNumber || dispute.orderId}</p>
            <p className="text-sm"><span className="text-muted-foreground">Product:</span> {dispute.productTitle}</p>
            <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {dispute.reason}</p>
            {dispute.description && <p className="text-sm text-muted-foreground">{dispute.description}</p>}
          </div>

          {dispute.evidence?.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">Evidence</h3>
              <ul className="space-y-2">
                {dispute.evidence.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {canResolve && (
            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-sm">Resolve Dispute</h3>
              <div>
                <label className="block text-sm font-medium mb-1.5">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleResolve}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" /> Resolve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeDetail;
