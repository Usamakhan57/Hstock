import React, { useEffect, useState } from 'react';
import { Loader2, PackagePlus, Check, X, Eye, Copy } from 'lucide-react';
import { disputesApi } from '../../services/disputesApi';
import { useToast } from '../../hooks/use-toast';
import { REPLACEMENT_STATUS_LABEL } from '../../lib/mappers/disputeMappers';

const ReplacementPanel = ({
  disputeId,
  replacements = [],
  role = 'buyer',
  readOnly = false,
  onChanged,
  replacementAttempts = 0,
  maxReplacementAttempts = 3,
  canReplace,
  disputeStatus = '',
}) => {
  const { toast } = useToast();
  const [credentialBlob, setCredentialBlob] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [revealingId, setRevealingId] = useState(null);

  const sorted = [...replacements].sort((a, b) => (b.version || 0) - (a.version || 0));
  const pending = sorted.find((rep) => rep.status === 'pending');
  const attempts = Math.max(
    Number(replacementAttempts) || 0,
    ...sorted.map((r) => Number(r.version) || 0),
    0,
  );
  const maxAttempts = Number(maxReplacementAttempts) || 3;
  const maxReached = disputeStatus === 'maximum_replacements_reached'
    || attempts >= maxAttempts;
  const sellerCanReplace = role === 'seller'
    && !readOnly
    && !pending
    && (canReplace !== false)
    && !maxReached
    && disputeStatus !== 'waiting_for_buyer_confirmation'
    && !['resolved', 'closed'].includes(disputeStatus);

  useEffect(() => {
    if (role !== 'buyer' || !pending?.id || revealed[pending.id]) return undefined;
    let cancelled = false;
    (async () => {
      setRevealingId(pending.id);
      try {
        const data = await disputesApi.revealReplacementBlob(disputeId, pending.id);
        if (!cancelled) {
          setRevealed((prev) => ({
            ...prev,
            [pending.id]: data.credentialBlob || data.credentials?.credentialBlob || '',
          }));
        }
      } catch {
        // Buyer can tap View manually if auto-reveal fails.
      } finally {
        if (!cancelled) setRevealingId(null);
      }
    })();
    return () => { cancelled = true; };
  }, [role, pending?.id, disputeId, revealed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sellerCanReplace || submitting) return;
    if (!credentialBlob.trim()) {
      toast({
        title: 'Paste replacement account',
        description: 'Paste the complete account credentials into the text box.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await disputesApi.sendReplacement(disputeId, { credentialBlob });
      toast({
        title: 'Replacement submitted',
        description: 'Buyer will confirm whether the account works. This does not close the dispute.',
      });
      setCredentialBlob('');
      onChanged?.();
    } catch (err) {
      toast({ title: 'Could not submit replacement', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (replacementId, decision) => {
    if (role !== 'buyer' || readOnly) return;
    setRespondingId(replacementId);
    try {
      await disputesApi.respondReplacement(disputeId, replacementId, { decision });
      toast({
        title: decision === 'accepted' ? 'Dispute closed' : 'Replacement rejected',
        description: decision === 'accepted'
          ? 'Account works — escrow will release normally.'
          : 'Dispute updated. Seller may send another replacement if attempts remain.',
      });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Response failed', description: err.message, variant: 'destructive' });
    } finally {
      setRespondingId(null);
    }
  };

  const reveal = async (replacementId) => {
    setRevealingId(replacementId);
    try {
      const data = await disputesApi.revealReplacementBlob(disputeId, replacementId);
      setRevealed((prev) => ({
        ...prev,
        [replacementId]: data.credentialBlob || data.credentials?.credentialBlob || '',
      }));
    } catch (err) {
      toast({ title: 'Could not reveal credentials', description: err.message, variant: 'destructive' });
    } finally {
      setRevealingId(null);
    }
  };

  const copyBlob = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold">Replacement</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Seller pastes the complete replacement account as-is. Submitting a replacement never auto-closes the dispute.
          {' '}
          Attempts: {attempts}/{maxAttempts}
        </p>
      </div>

      {maxReached && role === 'seller' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Maximum replacement attempts reached.
        </div>
      )}

      {maxReached && role === 'buyer' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Maximum replacement limit reached.
          Refund will be processed automatically within 24 hours unless resolved by admin.
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No replacements submitted yet.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((rep) => {
            const blob = revealed[rep.id];
            return (
              <li key={rep.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{rep.versionLabel || `v${rep.version}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
                    {REPLACEMENT_STATUS_LABEL[rep.status] || rep.statusLabel || rep.status}
                  </span>
                </div>

                {blob ? (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Replacement credentials
                      </p>
                      <button
                        type="button"
                        onClick={() => copyBlob(blob)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-100">
                      {blob}
                    </pre>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => reveal(rep.id)}
                    disabled={revealingId === rep.id}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
                  >
                    {revealingId === rep.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    View credentials
                  </button>
                )}

                {role === 'buyer' && rep.status === 'pending' && !readOnly && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={respondingId === rep.id}
                      onClick={() => handleRespond(rep.id, 'accepted')}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {respondingId === rep.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Account Works — Close Dispute
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === rep.id}
                      onClick={() => handleRespond(rep.id, 'rejected')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" /> Replacement Doesn&apos;t Work
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {role === 'seller' && sellerCanReplace && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <PackagePlus className="h-4 w-4 text-primary" /> Send Replacement
          </div>
          <p className="text-xs text-muted-foreground">
            Paste the COMPLETE replacement account exactly as-is (email, password, recovery, 2FA, cookie, token). Do not split fields.
          </p>
          <textarea
            value={credentialBlob}
            onChange={(e) => setCredentialBlob(e.target.value)}
            rows={10}
            placeholder={'email@example.com\npassword\nrecovery...\n2FA codes...\ncookie...\ntoken...'}
            className="w-full rounded-2xl border border-border bg-secondary/50 px-3 py-3 font-mono text-sm outline-none focus:border-primary"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full brand-gradient px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            Submit replacement
          </button>
        </form>
      )}

      {role === 'seller' && !readOnly && maxReached && (
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground opacity-60 cursor-not-allowed"
        >
          <PackagePlus className="h-4 w-4" />
          Replace
        </button>
      )}
    </div>
  );
};

export default ReplacementPanel;
