import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Loader2, CheckCircle2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import CryptoAssetPicker from './CryptoAssetPicker';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';
import { ordersApi } from '../services/ordersApi';
import { buyerWalletApi } from '../services/buyerWalletApi';
import { paymentsApi } from '../services/paymentsApi';
import { estimateCommission, formatMoney } from '../constants/commerce';
import {
  CHECKOUT_CRYPTO_ASSETS,
  resolveNetworkFromCatalog,
} from '../constants/cryptoAssets';

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
 * Purchase confirmation — Cryptomus invoice OR prepaid wallet balance.
 */
const PurchaseModal = ({ product, license, open, onOpenChange }) => {
  const { user, profiles } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [paySource, setPaySource] = useState('cryptomus');
  const [checkoutAssets, setCheckoutAssets] = useState(CHECKOUT_CRYPTO_ASSETS);
  const [coin, setCoin] = useState(CHECKOUT_CRYPTO_ASSETS[0].symbol);
  const [network, setNetwork] = useState(
    resolveNetworkFromCatalog(CHECKOUT_CRYPTO_ASSETS, CHECKOUT_CRYPTO_ASSETS[0].symbol, null),
  );
  const [wallet, setWallet] = useState(null);

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
    && (paySource === 'cryptomus' || (paySource === 'wallet' && walletEnough && !wallet?.frozen));

  useEffect(() => {
    if (!open || !user) return undefined;
    let cancelled = false;
    buyerWalletApi.getWallet()
      .then((data) => { if (!cancelled) setWallet(data); })
      .catch(() => { if (!cancelled) setWallet(null); });
    return () => { cancelled = true; };
  }, [open, user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    let cancelled = false;
    paymentsApi.listCheckoutAssets()
      .then((result) => {
        if (cancelled) return;
        const assets = Array.isArray(result?.assets) && result.assets.length
          ? result.assets
          : CHECKOUT_CRYPTO_ASSETS;
        setCheckoutAssets(assets);
        setCoin((current) => {
          const stillValid = assets.some((asset) => asset.symbol === current);
          const nextCoin = stillValid ? current : assets[0].symbol;
          setNetwork((currentNetwork) => resolveNetworkFromCatalog(assets, nextCoin, currentNetwork));
          return nextCoin;
        });
      })
      .catch(() => {
        if (!cancelled) setCheckoutAssets(CHECKOUT_CRYPTO_ASSETS);
      });
    return () => { cancelled = true; };
  }, [open, user]);

  if (!product) return null;

  const handleConfirm = async () => {
    if (!canPurchase) return;
    setSubmitting(true);
    try {
      const result = await ordersApi.buyNow({
        productId: product.id || product._id,
        quantity,
        paymentMethod: paySource,
        toCurrency: coin,
        network,
      });

      onOpenChange(false);

      if (paySource === 'wallet') {
        toast({
          title: 'Purchase complete',
          description: 'Paid from wallet. Funds are held in escrow.',
        });
        navigate(`/order-success?order=${encodeURIComponent(result.order?.id || result.raw?.order?.orderNumber || '')}`);
        return;
      }

      if (result.paymentUrl) {
        toast({
          title: result.raw?.reused ? 'Resuming payment' : 'Redirecting to payment',
          description: result.raw?.reused
            ? 'Opening your existing unpaid Cryptomus invoice.'
            : 'Complete payment with Cryptomus to secure your order in escrow.',
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
      if (err?.code === 'INSUFFICIENT_WALLET_BALANCE' || /insufficient wallet/i.test(message)) {
        setPaySource('cryptomus');
      }
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
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100vw-32px)] max-w-[420px] flex-col gap-0 overflow-hidden rounded-[24px] border border-border bg-background p-0 sm:max-w-[90vw] md:max-w-[640px]"
        onOpenAutoFocus={(event) => {
          // Keep focus inside the scrollable body so wheel/touch scrolling works immediately.
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
        <DialogDescription className="sr-only">Confirm your ApnaStore purchase and pay with wallet or Cryptomus</DialogDescription>

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
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold">Total Amount</span>
            <span className="min-w-[98px] text-right font-black text-lg">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="text-sm font-medium block">Payment method</label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaySource('cryptomus')}
              className={`rounded-2xl border p-4 text-left transition ${paySource === 'cryptomus' ? 'border-primary bg-primary/5' : 'border-border bg-secondary/40'}`}
            >
              <p className="text-sm font-bold">Pay Direct (Cryptomus)</p>
              <p className="mt-1 text-xs text-muted-foreground">Create a crypto invoice and fund escrow.</p>
            </button>
            <button
              type="button"
              onClick={() => setPaySource('wallet')}
              className={`rounded-2xl border p-4 text-left transition ${paySource === 'wallet' ? 'border-primary bg-primary/5' : 'border-border bg-secondary/40'}`}
            >
              <p className="text-sm font-bold inline-flex items-center gap-2"><Wallet className="w-4 h-4" /> Pay from Wallet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Available: ${walletBalance.toFixed(2)}
                {!walletEnough ? ' — deposit required' : ''}
              </p>
            </button>
          </div>
        </div>

        {paySource === 'cryptomus' ? (
          <div className="mt-4">
            <CryptoAssetPicker
              coin={coin}
              network={network}
              onCoinChange={setCoin}
              onNetworkChange={setNetwork}
              assets={checkoutAssets}
              disabled={submitting}
              currencyTitle="Pay with"
              currencyDescription="Select a Cryptomus currency for this purchase."
              routeLabel="Selected payment route"
            />
          </div>
        ) : !walletEnough ? (
          <div className="mt-4 rounded-[16px] bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <p className="font-semibold">Insufficient wallet balance.</p>
            <p className="mt-1">Deposit or top up with Cryptomus, then return to checkout.</p>
            <Link to="/wallet" className="inline-flex mt-3 font-semibold text-primary underline" onClick={() => onOpenChange(false)}>
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
            <span>
              {paySource === 'wallet'
                ? 'Wallet payment is confirmed instantly and held in escrow until release.'
                : 'After Cryptomus payment is verified, funds stay in escrow until release.'}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleConfirm}
          className="mt-5 h-[58px] w-full inline-flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#7B4DFF] to-[#E943B4] px-5 text-sm font-semibold text-white shadow-lg shadow-[#7B4DFF]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>
            {submitting
              ? 'Processing…'
              : paySource === 'wallet'
                ? 'Confirm & Pay from Wallet'
                : 'Confirm & Pay with Cryptomus'}
          </span>
        </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
