import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Megaphone, Wallet, CheckCircle2, Sparkles, Clock3 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { storePromotionApi } from '../services/storePromotionApi';

function formatCountdown(expiresAt, nowMs) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - nowMs;
  if (ms <= 0) return 'Expired';
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${Math.max(1, minutes)}m remaining`;
}

/**
 * Seller paid store promotion — $10 / 72h from seller wallet only.
 */
const PromoteStoreModal = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    storePromotionApi.getStatus()
      .then((data) => { if (!cancelled) setStatus(data); })
      .catch((err) => {
        if (!cancelled) {
          toast({
            title: 'Could not load promotion',
            description: err?.message || 'Please try again',
            variant: 'destructive',
          });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, toast]);

  useEffect(() => {
    if (!open || !status?.activePromotion?.expiresAt) return undefined;
    const timer = setInterval(() => setNowTick(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, [open, status?.activePromotion?.expiresAt]);

  const settings = status?.settings || { priceUsd: 10, durationHours: 72, enabled: true };
  const balance = Number(status?.wallet?.availableBalance || 0);
  const price = Number(settings.priceUsd || 10);
  const durationHours = Number(settings.durationHours || 72);
  const durationDays = Math.round(durationHours / 24);
  const canAfford = balance + 1e-9 >= price;
  const active = status?.activePromotion
    && status.activePromotion.expiresAt
    && new Date(status.activePromotion.expiresAt).getTime() > nowTick
    ? status.activePromotion
    : null;
  const disabled = settings.enabled === false;
  const countdown = active ? formatCountdown(active.expiresAt, nowTick) : null;

  const handlePay = async () => {
    if (submitting || !canAfford || disabled || active) return;
    setSubmitting(true);
    try {
      const result = await storePromotionApi.purchase();
      toast({
        title: result.reused ? 'Already promoted' : 'Store promoted',
        description: result.reused
          ? 'Your store promotion is already active.'
          : `Featured for ${durationDays} days. Badges and priority are live.`,
      });
      onSuccess?.(result);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Promotion failed',
        description: err?.message || 'Could not purchase promotion',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] rounded-[24px] border border-border bg-background p-0 overflow-hidden">
        <div className="px-6 py-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600">
            <Megaphone className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-4 text-xl font-bold">Promote Store</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Boost visibility with a Featured Seller promotion paid from your seller wallet.
          </DialogDescription>

          {loading ? (
            <div className="mt-8 flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-secondary/50 p-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold text-lg">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold">{durationDays} Days ({durationHours} Hours)</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> Wallet Balance
                  </span>
                  <span className="font-semibold">${balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold mb-2">Benefits</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    'Higher visibility',
                    'Featured Seller',
                    'Priority in search',
                    'Promotion badge',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {active ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Promotion active
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-medium">
                    <Clock3 className="h-3.5 w-3.5" />
                    {countdown}
                  </p>
                  <p className="mt-1 text-xs">
                    Expires {active.expiresAt ? new Date(active.expiresAt).toLocaleString() : 'soon'}.
                  </p>
                </div>
              ) : null}

              {disabled ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Store promotion is currently disabled by the platform.
                </div>
              ) : !canAfford && !active ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Insufficient Wallet Balance.</p>
                  <Link
                    to="/seller/earnings"
                    className="inline-flex mt-2 font-semibold text-primary underline"
                    onClick={() => onOpenChange(false)}
                  >
                    Go to Wallet
                  </Link>
                </div>
              ) : null}

              <button
                type="button"
                disabled={submitting || disabled || !!active || !canAfford}
                onClick={handlePay}
                className="mt-6 h-12 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                {active ? 'Already Active' : `Pay $${price.toFixed(0)}`}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoteStoreModal;
