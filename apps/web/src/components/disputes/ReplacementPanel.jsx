import React, { useState } from 'react';
import { Loader2, PackagePlus, Check, X } from 'lucide-react';
import { disputesApi } from '../../services/disputesApi';
import { useToast } from '../../hooks/use-toast';
import { REPLACEMENT_STATUS_LABEL } from '../../lib/mappers/disputeMappers';

const emptyAccount = () => ({
  accountIdentifier: '',
  username: '',
  email: '',
  password: '',
  notes: '',
});

const ReplacementPanel = ({
  disputeId,
  replacements = [],
  role = 'buyer',
  readOnly = false,
  onChanged,
}) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([emptyAccount()]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const updateAccount = (index, field, value) => {
    setAccounts((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== 'seller' || readOnly || submitting) return;
    const cleaned = accounts
      .map((a) => ({
        accountIdentifier: a.accountIdentifier.trim(),
        username: a.username.trim() || undefined,
        email: a.email.trim() || undefined,
        password: a.password || undefined,
        notes: a.notes.trim() || undefined,
      }))
      .filter((a) => a.accountIdentifier);

    if (!cleaned.length) {
      toast({ title: 'Add accounts', description: 'At least one replacement account is required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await disputesApi.sendReplacement(disputeId, { notes: notes.trim() || undefined, accounts: cleaned });
      toast({ title: 'Replacement submitted', description: `Version v${(replacements[0]?.version || 0) + 1} sent to buyer.` });
      setAccounts([emptyAccount()]);
      setNotes('');
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
        title: decision === 'accepted' ? 'Replacement accepted' : 'Replacement rejected',
        description: decision === 'accepted'
          ? 'Disputed items will resolve with the replacement accounts.'
          : 'Seller may submit another version.',
      });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Response failed', description: err.message, variant: 'destructive' });
    } finally {
      setRespondingId(null);
    }
  };

  const sorted = [...replacements].sort((a, b) => (b.version || 0) - (a.version || 0));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold">Replacement history</h3>
        <p className="mt-1 text-sm text-muted-foreground">Versions are never overwritten — each submission creates v1, v2, v3…</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No replacements submitted yet.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((rep) => (
            <li key={rep.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{rep.versionLabel || `v${rep.version}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : '—'}
                    {' · '}
                    {rep.accounts?.length || 0} account(s)
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
                  {REPLACEMENT_STATUS_LABEL[rep.status] || rep.statusLabel || rep.status}
                </span>
              </div>
              {rep.notes ? <p className="mt-2 text-sm text-muted-foreground">{rep.notes}</p> : null}
              <ul className="mt-3 space-y-1.5">
                {(rep.accounts || []).map((account) => (
                  <li key={account.id || account.accountIdentifier} className="rounded-xl bg-secondary/50 px-3 py-2 text-xs">
                    <span className="font-semibold">{account.accountIdentifier}</span>
                    {account.username || account.email ? (
                      <span className="text-muted-foreground"> · {account.username || account.email}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {role === 'buyer' && rep.status === 'pending' && !readOnly && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={respondingId === rep.id}
                    onClick={() => handleRespond(rep.id, 'accepted')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {respondingId === rep.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={respondingId === rep.id}
                    onClick={() => handleRespond(rep.id, 'rejected')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {role === 'seller' && !readOnly && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <PackagePlus className="h-4 w-4 text-primary" /> Submit replacement accounts
          </div>
          {accounts.map((account, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-2">
              <input
                required
                value={account.accountIdentifier}
                onChange={(e) => updateAccount(index, 'accountIdentifier', e.target.value)}
                placeholder="Account identifier *"
                className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-2"
              />
              <input value={account.username} onChange={(e) => updateAccount(index, 'username', e.target.value)} placeholder="Username" className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={account.email} onChange={(e) => updateAccount(index, 'email', e.target.value)} placeholder="Email" className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary" />
              <input type="password" value={account.password} onChange={(e) => updateAccount(index, 'password', e.target.value)} placeholder="Password" className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={account.notes} onChange={(e) => updateAccount(index, 'notes', e.target.value)} placeholder="Notes" className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAccounts((prev) => [...prev, emptyAccount()])}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              Add another account
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes for the buyer"
            className="w-full rounded-2xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
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
    </div>
  );
};

export default ReplacementPanel;
