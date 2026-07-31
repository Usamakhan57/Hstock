import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';
import { ordersApi } from '../services/ordersApi';
import { estimateCommission, formatMoney, PAYMENT_CURRENCIES } from '../constants/commerce';

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
 * Purchase confirmation → Cryptomus payment entry.
 * Buy Now → Confirm → redirect to Cryptomus invoice URL.
 */
const PurchaseModal = ({ product, license, open, onOpenChange }) => {
  const { user, profiles } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_CURRENCIES[0].label);

  const quantity = Math.max(1, Number(product?.quantity) || 1);
  const unitPrice = formatMoney(
    typeof product?.unitPrice === 'number'
      ? product.unitPrice
      : (license?.price ?? product?.price ?? 0),
  );
  const subtotal = formatMoney(unitPrice * quantity);
  const fee = estimateCommission(subtotal);
  const selected = PAYMENT_CURRENCIES.find((c) => c.label === paymentMethod) || PAYMENT_CURRENCIES[0];
  const ownProduct = isOwnProduct(product, user, profiles);
  const outOfStock = !!product && !product.unlimitedStock && product.stock != null && product.stock < quantity;
  const canPurchase = !!product && !!user && !ownProduct && !outOfStock && unitPrice > 0 && !submitting;

  if (!product) return null;

  const handleConfirm = async () => {
    if (!canPurchase) return;
    setSubmitting(true);
    try {
      const result = await ordersApi.buyNow({
        productId: product.id || product._id,
        quantity,
        toCurrency: selected.coin,
        network: selected.network,
      });

      onOpenChange(false);

      if (result.paymentUrl) {
        toast({
          title: 'Redirecting to payment',
          description: 'Complete payment with Cryptomus to secure your order in escrow.',
        });
        window.location.assign(result.paymentUrl);
        return;
      }

      toast({
        title: 'Payment unavailable',
        description: 'Could not create a payment invoice. Please try again.',
        variant: 'destructive',
      });
      navigate('/order-failed', { state: { reason: 'Payment invoice could not be created.' } });
    } catch (err) {
      const message = err?.message || 'Purchase failed. Please try again.';
      toast({ title: 'Purchase failed', description: message, variant: 'destructive' });
      if (err?.status === 401) {
        onOpenChange(false);
        navigate('/login', { state: { from: { pathname: `/product/${product.id}` } } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[420px] sm:max-w-[90vw] md:max-w-[640px] rounded-[24px] border border-border bg-background px-4 py-5 sm:px-6 sm:py-6 md:px-7 md:py-7">
        <DialogTitle className="text-xl font-bold">Confirm Purchase</DialogTitle>
        <DialogDescription className="sr-only">Confirm your ApnaStore purchase and continue to Cryptomus payment</DialogDescription>

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
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Product Price</span>
              <span className="min-w-[98px] text-right font-semibold">${subtotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold">Total Amount</span>
            <span className="min-w-[98px] text-right font-black text-lg">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium block mb-1.5">Pay with</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm font-medium outline-none"
          >
            {PAYMENT_CURRENCIES.map((c) => (
              <option key={c.label} value={c.label}>{c.label}</option>
            ))}
          </select>
        </div>

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
            <span>After Cryptomus payment is verified, funds stay in escrow until release.</span>
          </div>
        )}

        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleConfirm}
          className="mt-5 h-[58px] w-full inline-flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#7B4DFF] to-[#E943B4] px-5 text-sm font-semibold text-white shadow-lg shadow-[#7B4DFF]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{submitting ? 'Starting payment…' : 'Confirm & Pay with Cryptomus'}</span>
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
