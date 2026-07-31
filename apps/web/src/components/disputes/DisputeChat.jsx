import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, Loader2, Paperclip, Send, Trash2, KeyRound, Eye,
} from 'lucide-react';
import { disputesApi } from '../../services/disputesApi';
import { uploadEvidenceFiles } from '../../lib/evidenceUpload';
import { useToast } from '../../hooks/use-toast';

const DisputeChat = ({
  disputeId,
  readOnly = false,
  currentUserId = null,
  pollMs = 12000,
}) => {
  const { toast } = useToast();
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState('');
  const [credOpen, setCredOpen] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', email: '', password: '', otp: '' });
  const [revealed, setRevealed] = useState({});

  const load = useCallback(async () => {
    if (!disputeId) return;
    try {
      const { items } = await disputesApi.listMessages(disputeId, { page: 1, limit: 100 });
      setMessages(items);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load chat');
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!disputeId || readOnly) return undefined;
    const timer = setInterval(load, pollMs);
    return () => clearInterval(timer);
  }, [disputeId, readOnly, pollMs, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleAttach = async (fileList) => {
    if (!fileList?.length || readOnly) return;
    try {
      const uploaded = await uploadEvidenceFiles(fileList);
      const ok = uploaded.filter((f) => f.url);
      setPendingAttachments((prev) => [...prev, ...ok].slice(0, 20));
      if (uploaded.some((f) => f.error)) {
        toast({ title: 'Some uploads failed', description: 'Remove and retry failed files.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (readOnly || sending) return;
    const body = draft.trim();
    if (!body && !pendingAttachments.length) return;
    setSending(true);
    setBlockedNotice('');
    try {
      const { message } = await disputesApi.sendMessage(disputeId, {
        body: body || 'Shared attachment',
        attachments: pendingAttachments.map((a) => a.url),
      });
      setMessages((prev) => [...prev, message]);
      setDraft('');
      setPendingAttachments([]);
    } catch (err) {
      const code = err.code || '';
      if (code.includes('CONTACT') || /contact|blocked|filter/i.test(err.message || '')) {
        setBlockedNotice(err.message || 'Message blocked by security filter.');
      }
      toast({ title: 'Message not sent', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleSendCredentials = async () => {
    if (readOnly || sending) return;
    const payload = Object.fromEntries(
      Object.entries(credentials).filter(([, v]) => String(v || '').trim()),
    );
    if (!Object.keys(payload).length) {
      toast({ title: 'Add credentials', description: 'Fill at least one field.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { message } = await disputesApi.sendCredentials(disputeId, { credentials: payload });
      setMessages((prev) => [...prev, message]);
      setCredentials({ username: '', email: '', password: '', otp: '' });
      setCredOpen(false);
      toast({ title: 'Credentials shared securely' });
    } catch (err) {
      toast({ title: 'Could not share credentials', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleReveal = async (messageId) => {
    try {
      const data = await disputesApi.revealCredentials(disputeId, messageId);
      setRevealed((prev) => ({ ...prev, [messageId]: data.credentials || data }));
    } catch (err) {
      toast({ title: 'Reveal failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (messageId) => {
    try {
      const updated = await disputesApi.deleteMessage(disputeId, messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading secure chat…
      </div>
    );
  }

  if (error && !messages.length) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button type="button" onClick={load} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[22rem] flex-col">
      {readOnly && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Chat is read-only — this dispute is closed or resolved.
        </div>
      )}
      {blockedNotice && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{blockedNotice}</span>
        </div>
      )}

      <div className="max-h-80 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Start the secure conversation.</p>
        ) : messages.map((m) => {
          const mine = currentUserId && m.senderId && String(m.senderId) === String(currentUserId);
          const alignEnd = mine || m.senderRole === 'seller';
          return (
            <div key={m.id} className={`flex ${alignEnd ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                alignEnd ? 'brand-gradient text-white' : 'bg-secondary text-foreground'
              }`}>
                <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${alignEnd ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {m.senderRole || 'party'}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.attachments.map((a, idx) => (
                      <a
                        key={a.id || `${m.id}-a-${idx}`}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`block truncate text-xs underline ${alignEnd ? 'text-white/90' : 'text-primary'}`}
                      >
                        Attachment {idx + 1}
                        {a.ocrFlagged ? ' · OCR flagged' : ''}
                      </a>
                    ))}
                  </div>
                )}
                {m.hasCredentials && (
                  <div className="mt-2">
                    {revealed[m.id] ? (
                      <pre className={`overflow-x-auto rounded-xl p-2 text-[11px] ${alignEnd ? 'bg-black/20' : 'bg-white/80'}`}>
                        {JSON.stringify(revealed[m.id], null, 2)}
                      </pre>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReveal(m.id)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold underline ${alignEnd ? 'text-white' : 'text-primary'}`}
                      >
                        <Eye className="h-3 w-3" /> Reveal credentials
                      </button>
                    )}
                  </div>
                )}
                <div className={`mt-1 flex items-center gap-2 text-[10px] ${alignEnd ? 'text-white/70' : 'text-muted-foreground'}`}>
                  <span>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</span>
                  {!readOnly && mine && !m.deletedAt && (
                    <button type="button" onClick={() => handleDelete(m.id)} className="inline-flex items-center gap-0.5 hover:underline">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!readOnly && (
        <>
          {pendingAttachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingAttachments.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px]">
                  {a.name}
                  <button type="button" onClick={() => setPendingAttachments((prev) => prev.filter((x) => x.id !== a.id))} className="text-destructive">×</button>
                </span>
              ))}
            </div>
          )}

          {credOpen && (
            <div className="mt-3 grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-2">
              {['username', 'email', 'password', 'otp'].map((field) => (
                <input
                  key={field}
                  type={field === 'password' ? 'password' : 'text'}
                  value={credentials[field]}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={field}
                  className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              ))}
              <button
                type="button"
                onClick={handleSendCredentials}
                disabled={sending}
                className="sm:col-span-2 rounded-full brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Send encrypted credentials
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 border-t border-border pt-4">
            <input ref={fileRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => handleAttach(e.target.files)} />
            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary" aria-label="Attach file">
              <Paperclip className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setCredOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary" aria-label="Share credentials">
              <KeyRound className="h-4 w-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a secure message…"
              className="flex-1 rounded-full border border-transparent bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button type="submit" disabled={sending} aria-label="Send" className="grid h-10 w-10 place-items-center rounded-full brand-gradient text-white disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default DisputeChat;
