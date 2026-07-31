import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';

/**
 * Purchase flow entry (Phase 4): Product → Buy Now opens this modal.
 * Payment / Cryptomus / full checkout belong to later commerce phases.
 * Until then this surface remains the authenticated Buy Now entry point.
 */
const PurchaseModal = ({ product, license, open, onOpenChange }) => {
  const { wallet, confirmPurchase } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const price = license?.price ?? product.price ?? 0;
  const quantity = product.quantity ?? 1;
  const unitPrice = typeof product.unitPrice === 'number' ? product.unitPrice : price;
  const remaining = Math.round((wallet - price) * 100) / 100;
  const canAfford = wallet >= price;

  const handleConfirm = () => {
    if (!canAfford || submitting) return;
    setSubmitting(true);
    const result = confirmPurchase({
      product,
      licenseId: license?.id,
      licenseName: license?.name,
      price,
    });
    setSubmitting(false);
    if (!result?.success) {
      toast({ title: 'Purchase failed', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    onOpenChange(false);
    toast({ title: 'Purchase confirmed', description: `${product.title} — funds held in escrow until access is confirmed.` });
    navigate(`/orders/${result.order.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[420px] sm:max-w-[90vw] md:max-w-[640px] rounded-[24px] border border-border bg-background px-4 py-5 sm:px-6 sm:py-6 md:px-7 md:py-7">
        <DialogTitle className="text-xl font-bold">Confirm Purchase</DialogTitle>
        <DialogDescription className="sr-only">Confirm your HStock.store purchase using your wallet balance</DialogDescription>

        <div className="mt-6 flex flex-col gap-4 rounded-[16px] bg-secondary/50 p-4 md:p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 overflow-hidden rounded-[16px] bg-secondary">
              <img
                src={product.img}
                alt={product.title}
                className="h-14 w-14 object-cover sm:h-18 sm:w-18 md:h-18 md:w-18"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-[1.3] line-clamp-2">{product.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">by {product.artist}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[16px] bg-secondary/50 p-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Wallet Balance</span>
              <span className="min-w-[98px] text-right font-semibold">${wallet.toFixed(2)}</span>
            </div>
            {quantity > 1 && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Unit Price</span>
                  <span className="min-w-[98px] text-right font-semibold">${unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <span className="min-w-[98px] text-right font-semibold">{quantity}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Product Price</span>
              <span className="min-w-[98px] text-right font-semibold">${price.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold">Balance After Purchase</span>
            <span className={`min-w-[98px] text-right font-black text-lg ${canAfford ? '' : 'text-destructive'}`}>
              ${((canAfford ? remaining : wallet)).toFixed(2)}
            </span>
          </div>
        </div>

        {!canAfford ? (
          <div className="mt-5 rounded-[16px] bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Insufficient wallet balance</p>
                <p className="mt-1">Deposit at least ${(price - wallet).toFixed(2)} more to complete this purchase.</p>
                <Link
                  to="/wallet"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-primary hover:underline"
                >
                  Deposit Balance
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2 rounded-[16px] bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Your payment will remain in escrow until access is confirmed.</span>
          </div>
        )}

        <button
          type="button"
          disabled={!canAfford || submitting}
          onClick={handleConfirm}
          className="mt-5 h-[58px] w-full rounded-[16px] bg-gradient-to-r from-[#7B4DFF] to-[#E943B4] px-5 text-sm font-semibold text-white shadow-lg shadow-[#7B4DFF]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{canAfford ? 'Confirm Purchase' : 'Deposit Balance to Continue'}</span>
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
