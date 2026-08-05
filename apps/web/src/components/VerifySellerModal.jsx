import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldCheck, Wallet, BadgeCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { sellerVerificationApi } from '../services/sellerVerificationApi';
import { invalidateSellerCatalog } from '../services/catalogCache';

/**
 * One-time $10 seller-wallet purchase for permanent Verified Seller badge.
 */
const VerifySellerModal = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    sellerVerificationApi.getStatus()
      .then((data) => { if (!cancelled) setStatus(data); })
      .catch((err) => {
        if (!cancelled) {
          toast({
            title: 'Could not load verification',
            description: err?.message || 'Please try again',
            variant: 'destructive',
          });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, toast]);

  const settings = status?.settings || { feeUsd: 10, enabled: true };
  const balance = Number(status?.wallet?.availableBalance || 0);
  const fee = Number(settings.feeUsd || 10);
  const canAfford = balance + 1e-9 >= fee;
  const verified = status?.verified === true || status?.sellerVerified === true;
  const disabled = settings.enabled === false;

  const handlePay = async () => {
    if (submitting || !canAfford || disabled || verified) return;
    const confirmed = window.confirm(
      `Pay $${fee.toFixed(2)} to permanently verify your seller account?`,
    );
    if (!confirmed) return;
    setSubmitting(true);
    try {
      const result = await sellerVerificationApi.purchase();
      await invalidateSellerCatalog().catch(() => null);
      toast({
        title: result.reused ? 'Already verified' : 'You are now verified',
        description: result.reused
          ? 'Your Verified Seller badge is already active.'
          : 'Your permanent Verified Seller badge is live across the marketplace.',
      });
      onSuccess?.(result);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Verification failed',
        description: err?.message || 'Could not complete verification',
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
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-4 text-xl font-bold">Verify Now</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Pay ${fee.toFixed(2)} once from your seller wallet for a permanent Verified Seller badge.
          </DialogDescription>

          {loading ? (
            <div className="mt-8 flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-secondary/50 p-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">One-time fee</span>
                  <span className="font-bold text-lg">${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold">Permanent</span>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> Seller wallet
                  </span>
                  <span className="font-semibold">${balance.toFixed(2)}</span>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  Permanent Verified Badge marketplace-wide
                </li>
                <li className="flex items-start gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  Higher buyer trust and credibility
                </li>
              </ul>

              {verified ? (
                <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Your account is already verified.
                </p>
              ) : disabled ? (
                <p className="mt-5 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                  Seller verification is currently disabled.
                </p>
              ) : !canAfford ? (
                <div className="mt-5 space-y-3">
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Insufficient wallet balance. Please deposit funds first.
                  </p>
                  <Link
                    to="/seller/earnings"
                    className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                    onClick={() => onOpenChange(false)}
                  >
                    Top Up Wallet
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePay}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Pay ${fee.toFixed(2)} to permanently verify
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifySellerModal;
