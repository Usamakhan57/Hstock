import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Loader2, CheckCircle2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';
import { ordersApi } from '../services/ordersApi';
import { buyerWalletApi } from '../services/buyerWalletApi';
import { estimateCommission, formatMoney } from '../constants/commerce';

function createCheckoutIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function isOwnProduct(product, user, profiles) {
  if (!product) return false;
  const sellerProfileId = profiles?.seller?.id || profiles?.seller?._id;
  const sellerUserId = profiles?.seller?.user || profiles?.seller?.userId;
  if (product.sellerId && sellerProfileId && String(product.sellerId) === String(sellerProfileId)) {
    return true;
  }
  if (product.sellerUserId && user?.id && String(product.sellerUserId) === String(user.id)) {
    return true;
  }
  if (product.sellerUserId && sellerUserId && String(product.sellerUserId) === String(sellerUserId)) {
    return true;
  }
  return false;
}

/**
 * Purchase confirmation — Buyer Wallet only.
 * Cryptomus is used solely for wallet deposits on /account/wallet.
 */
const PurchaseModal = ({ product, license, open, onOpenChange }) => {
  const { user, profiles } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef(null);

  const quantity = Math.max(1, Number(product?.quantity) || 1);
  const unitPrice = formatMoney(
    typeof product?.unitPrice === 'number'
      ? product.unitPrice
      : (license?.price ?? product?.price ?? 0),
  );
  const subtotal = formatMoney(unitPrice * quantity);
  const fee = estimateCommission(subtotal);
  const ownProduct = isOwnProduct(product, user, profiles);
  const outOfStock = !!product && !product.unlimitedStock && product.stock != null && product.stock < quantity;
  const walletBalance = Number(wallet?.availableBalance || 0);
  const walletEnough = walletBalance + 1e-9 >= subtotal;
  const canPurchase = !!product && !!user && !ownProduct && !outOfStock && unitPrice > 0 && !submitting
    && walletEnough && !wallet?.frozen;

  useEffect(() => {
    if (!open || !user) return undefined;
    let cancelled = false;
    buyerWalletApi.getWallet()
      .then((data) => { if (!cancelled) setWallet(data); })
      .catch(() => { if (!cancelled) setWallet(null); });
    return () => { cancelled = true; };
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      submittingRef.current = false;
      idempotencyKeyRef.current = null;
    }
  }, [open]);

  if (!product) return null;

  const handleConfirm = async () => {
    if (!canPurchase || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createCheckoutIdempotencyKey();
    }
    try {
      const result = await ordersApi.buyNow({
        productId: product.id || product._id,
        quantity,
        paymentMethod: 'wallet',
        idempotencyKey: idempotencyKeyRef.current,
      });

      onOpenChange(false);
      idempotencyKeyRef.current = null;

      toast({
        title: 'Purchase complete',
        description: 'Paid from wallet. Funds are held in escrow.',
      });
      navigate(`/order-success?order=${encodeURIComponent(result.order?.id || result.raw?.order?.orderNumber || '')}`);
    } catch (err) {
      const message = err?.message || 'Purchase failed. Please try again.';
      toast({ title: 'Purchase failed', description: message, variant: 'destructive' });
      if (err?.status === 401) {
        onOpenChange(false);
        navigate('/login', { state: { from: { pathname: `/product/${product.id}` } } });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100vw-32px)] max-w-[420px] flex-col gap-0 overflow-hidden rounded-[24px] border border-border bg-background p-0 sm:max-w-[90vw] md:max-w-[640px]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          event.currentTarget?.querySelector?.('[data-purchase-scroll]')?.focus?.({ preventScroll: true });
        }}
      >
        <div
          data-purchase-scroll
          tabIndex={-1}
          className="max-h-[90dvh] overflow-y-auto overscroll-contain px-4 py-5 outline-none sm:px-6 sm:py-6 md:px-7 md:py-7"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
        <DialogTitle className="text-xl font-bold">Confirm Purchase</DialogTitle>
        <DialogDescription className="sr-only">Confirm your ApnaStore purchase and pay from your buyer wallet</DialogDescription>

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
              <p className="mt-2 text-xs text-muted-foreground">Seller: {product.artist}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[16px] bg-secondary/50 p-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Wallet Balance
              </span>
              <span className="min-w-[98px] text-right font-semibold">${walletBalance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Unit Price</span>
              <span className="min-w-[98px] text-right font-semibold">${unitPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="min-w-[98px] text-right font-semibold">{quantity}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Platform Fee</span>
              <span className="min-w-[98px] text-right font-semibold">${fee.commissionAmount.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Platform fee (~{fee.percent}%) is deducted from the seller payout — you pay the product total.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold">Total Amount</span>
            <span className="min-w-[98px] text-right font-black text-lg">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        {!walletEnough ? (
          <div className="mt-5 rounded-[16px] bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <p className="font-semibold">Insufficient wallet balance.</p>
            <p className="mt-1">Deposit or top up with Cryptomus, then return to checkout.</p>
            <Link
              to="/account/wallet"
              className="inline-flex mt-3 font-semibold text-primary underline"
              onClick={() => onOpenChange(false)}
            >
              Go to Wallet
            </Link>
          </div>
        ) : null}

        {ownProduct ? (
          <div className="mt-5 rounded-[16px] bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold">You cannot buy your own product.</p>
            </div>
          </div>
        ) : outOfStock ? (
          <div className="mt-5 rounded-[16px] bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold">This product is out of stock.</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2 rounded-[16px] bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Wallet payment is confirmed instantly and held in escrow until release.</span>
          </div>
        )}

        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleConfirm}
          className="mt-5 h-[58px] w-full inline-flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#7B4DFF] to-[#E943B4] px-5 text-sm font-semibold text-white shadow-lg shadow-[#7B4DFF]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{submitting ? 'Processing…' : 'Pay from Wallet'}</span>
        </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
