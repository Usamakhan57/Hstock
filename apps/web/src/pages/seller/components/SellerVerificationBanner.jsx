import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Link2, Ban, Loader2, Send } from 'lucide-react';
import { telegramApi } from '../../../services/telegramApi';
import { useToast } from '../../../hooks/use-toast';

/**
 * Prominent seller approval status card shown at the top of the seller dashboard.
 */
const SellerVerificationBanner = ({ seller }) => {
  const { toast } = useToast();
  const status = String(seller?.status || 'pending').toLowerCase();
  const storeSlug = seller?.slug
    || (seller?.storeName || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  const storePath = storeSlug ? `/seller/${storeSlug}` : null;
  const storeUrl = storePath && typeof window !== 'undefined'
    ? `${window.location.origin}${storePath}`
    : storePath;
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isSuspended = status === 'suspended';

  const [telegramLoading, setTelegramLoading] = useState(isApproved);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState(null);

  const refreshTelegram = useCallback(async () => {
    if (!isApproved) return;
    setTelegramLoading(true);
    try {
      const next = await telegramApi.status();
      setTelegramConnected(Boolean(next.connected));
      setTelegramUsername(next.username || null);
    } catch {
      setTelegramConnected(false);
    } finally {
      setTelegramLoading(false);
    }
  }, [isApproved]);

  useEffect(() => {
    refreshTelegram();
  }, [refreshTelegram]);

  const handleConnectTelegram = async () => {
    if (telegramConnected || telegramBusy) return;
    setTelegramBusy(true);
    try {
      const result = await telegramApi.connect();
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast({
          title: 'Continue in Telegram',
          description: 'Press Start in the ApnaStore bot to finish connecting.',
        });
      }
      if (result.status?.connected) {
        setTelegramConnected(true);
        setTelegramUsername(result.status.username || null);
      } else {
        // Soft refresh shortly after the user returns from Telegram.
        setTimeout(() => {
          refreshTelegram();
        }, 4000);
      }
    } catch (err) {
      toast({
        title: 'Could not start Telegram connect',
        description: err.message || 'Please try again from Seller Settings.',
        variant: 'destructive',
      });
    } finally {
      setTelegramBusy(false);
    }
  };

  if (isApproved) {
    return (
      <div className="relative z-0 mb-6 w-full min-w-0 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:mb-8 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-tight text-emerald-900">
              ✅ Seller Account Approved
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-emerald-800/90">
              Your store is now live and your products are visible in the marketplace.
            </p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div>
                <dt className="text-emerald-700/80">Status</dt>
                <dd className="font-semibold text-emerald-950">Approved</dd>
              </div>
              {storeUrl ? (
                <div>
                  <dt className="text-emerald-700/80">Public Store URL</dt>
                  <dd className="mt-0.5 break-all font-medium text-emerald-950">
                    <a href={storeUrl} className="inline-flex items-center gap-1.5 hover:underline" target="_blank" rel="noreferrer">
                      <Link2 className="h-3.5 w-3.5" />
                      {storeUrl}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            {storeUrl ? (
              <a
                href={storeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Open Store
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}

            {telegramLoading ? (
              <div className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-5 text-sm font-semibold text-emerald-900">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking Telegram…
              </div>
            ) : telegramConnected ? (
              <div className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-800">
                <Send className="h-4 w-4 text-[#229ED9]" />
                Telegram Connected ✅
                {telegramUsername ? (
                  <span className="font-medium text-emerald-700/80">@{telegramUsername}</span>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectTelegram}
                disabled={telegramBusy}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                style={{ backgroundColor: '#229ED9' }}
              >
                {telegramBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Connect Telegram
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isRejected || isSuspended) {
    const title = isRejected ? 'Seller Account Rejected' : 'Seller Account Suspended';
    const description = isRejected
      ? 'Your seller application was not approved. Contact support if you believe this is a mistake.'
      : 'Your seller account is suspended. Public store features and payouts are disabled until reinstated.';
    return (
      <div className="relative z-0 mb-6 w-full min-w-0 rounded-[1.75rem] border border-red-200 bg-red-50 p-5 shadow-sm sm:mb-8 sm:p-6">
        <h2 className="text-lg font-black tracking-tight text-red-900">⛔ {title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-red-800/90">{description}</p>
        <p className="mt-4 text-sm font-semibold text-red-950">
          Current Status: {isRejected ? 'Rejected' : 'Suspended'}
        </p>
      </div>
    );
  }

  // Pending (default)
  return (
    <div className="relative z-0 mb-6 w-full min-w-0 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm sm:mb-8 sm:p-6">
      <h2 className="text-lg font-black tracking-tight text-amber-950">
        ⏳ Seller Verification Pending
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-amber-900/90">
        Your seller account is currently under review.
        You can upload products, but they will not appear publicly until an administrator approves your store.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-amber-800/80">Current Status</dt>
          <dd className="font-semibold text-amber-950">Pending Approval</dd>
        </div>
        <div>
          <dt className="text-amber-800/80">Estimated review</dt>
          <dd className="font-semibold text-amber-950">Usually within 24–48 hours</dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-1.5 text-sm text-amber-900/90">
        <li className="inline-flex items-center gap-2">
          <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Withdraw disabled until approval
        </li>
        <li className="inline-flex items-center gap-2">
          <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Payouts disabled until approval
        </li>
        <li className="inline-flex items-center gap-2">
          <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Public Store URL disabled until approval
        </li>
      </ul>
    </div>
  );
};

export default SellerVerificationBanner;
