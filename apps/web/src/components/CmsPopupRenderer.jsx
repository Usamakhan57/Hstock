import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';
import { newsletterApi } from '../services/api';

const DISMISS_PREFIX = 'cms_popup_dismissed:';

function isScheduledNow(popup, now = Date.now()) {
  const start = popup.scheduleStart ? new Date(popup.scheduleStart).getTime() : null;
  const end = popup.scheduleEnd ? new Date(popup.scheduleEnd).getTime() : null;
  if (start && Number.isFinite(start) && now < start) return false;
  if (end && Number.isFinite(end) && now > end) return false;
  return true;
}

/**
 * Renders enabled CMS popups from Popup Manager (Mongo-backed).
 */
export default function CmsPopupRenderer() {
  const { data } = useCms(CMS_KEYS.POPUPS);
  const [active, setActive] = useState(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const candidates = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.filter((p) => p?.enabled && isScheduledNow(p));
  }, [data]);

  useEffect(() => {
    if (!candidates.length) {
      setActive(null);
      return undefined;
    }

    const next = candidates.find((p) => {
      try {
        return !sessionStorage.getItem(`${DISMISS_PREFIX}${p.id}`);
      } catch {
        return true;
      }
    });

    if (!next) {
      setActive(null);
      return undefined;
    }

    const delay = Math.max(0, Number(next.delaySeconds) || 0) * 1000;
    const timer = window.setTimeout(() => setActive(next), delay);
    return () => window.clearTimeout(timer);
  }, [candidates]);

  const dismiss = () => {
    if (!active) return;
    try {
      sessionStorage.setItem(`${DISMISS_PREFIX}${active.id}`, '1');
    } catch {
      // ignore
    }
    setActive(null);
    setStatus('idle');
    setEmail('');
  };

  if (!active) return null;

  const submitNewsletter = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      await newsletterApi.subscribe(email.trim());
      setStatus('done');
      window.setTimeout(dismiss, 1200);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={active.headline || active.label}>
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close popup" onClick={dismiss} />
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-border soft-shadow-lg overflow-hidden animate-mega-in">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-secondary transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        {active.image && (
          <img src={active.image} alt="" className="w-full h-40 object-cover" />
        )}
        <div className="p-6 sm:p-8">
          {active.headline && <h2 className="text-xl font-extrabold tracking-tight">{active.headline}</h2>}
          {active.content && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{active.content}</p>}

          {active.type === 'newsletter' ? (
            status === 'done' ? (
              <p className="mt-5 text-sm font-semibold text-primary">You're subscribed — thanks!</p>
            ) : (
              <form onSubmit={submitNewsletter} className="mt-5 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="shrink-0 rounded-full brand-gradient text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
                >
                  {active.buttonText || 'Subscribe'}
                </button>
              </form>
            )
          ) : active.buttonText ? (
            active.buttonUrl ? (
              <Link
                to={active.buttonUrl}
                onClick={dismiss}
                className="mt-5 inline-flex items-center justify-center rounded-full brand-gradient text-white text-sm font-semibold px-6 py-3"
              >
                {active.buttonText}
              </Link>
            ) : (
              <button
                type="button"
                onClick={dismiss}
                className="mt-5 inline-flex items-center justify-center rounded-full brand-gradient text-white text-sm font-semibold px-6 py-3"
              >
                {active.buttonText}
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
