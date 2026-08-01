import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, Zap, ArrowRight, BadgeCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useStore } from '../context/StoreContext';
import { licenseCatalog } from '../data';
import { resolveSellerVerified } from '../services/sellerRepository';
import { getDeliveryTime, isManualHandover } from '../services/productMeta';
import PurchaseModal from './PurchaseModal';

/**
 * Lightweight product preview opened from a card's Quick View action.
 * Shows the essentials with a path to the full page or straight into
 * the Buy Now purchase flow.
 */
const QuickViewDialog = ({ product, open, onOpenChange }) => {
  const { user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  if (!product) return null;

  const realId = product.baseId ?? product.id;
  const productTypeLabel = isManualHandover(product) ? getDeliveryTime(product) : 'Instant Access';
  const fileTypes = Array.isArray(product.fileTypes) ? product.fileTypes : [];
  const sellerName = product.seller?.name || product.sellerName || product.artist || 'Seller';
  const defaultLicense = licenseCatalog[product.licenseIds?.[0]] || licenseCatalog.personal;
  const purchaseProduct = { ...product, id: realId };
  const purchaseLicense = {
    id: defaultLicense.id,
    name: defaultLicense.name,
    price: Math.round(product.price * defaultLicense.priceMultiplier * 100) / 100,
  };

  const handleBuyNow = () => {
    if (!user) {
      onOpenChange(false);
      navigate('/login', { state: { from: location } });
      return;
    }
    setPurchaseOpen(true);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
        <div className="grid sm:grid-cols-2">
          <div className="relative bg-secondary aspect-square sm:aspect-auto">
            <img src={product.img} alt={product.title} className="w-full h-full object-cover" />
            {product.badge && (
              <span className="absolute top-4 left-4 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur">
                {product.badge}
              </span>
            )}
          </div>
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <span>{product.cat}</span>
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">{productTypeLabel}</span>
            </div>

            <DialogTitle className="mt-2 text-xl font-bold leading-snug">{product.title}</DialogTitle>
            <DialogDescription className="sr-only">Quick view of {product.title}</DialogDescription>

            <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
              <span>by {sellerName}</span>
              {(product.verifiedSeller || resolveSellerVerified(sellerName)) && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Verified seller" />}
            </div>

            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="font-semibold text-foreground">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviewCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Instant download after purchase</span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/80 line-clamp-4">{product.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {fileTypes.slice(0, 3).map((t) => (
                <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{t}</span>
              ))}
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{productTypeLabel}</span>
            </div>

            <div className="mt-auto pt-6">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold">${product.price}</span>
                {product.old && <span className="text-sm text-muted-foreground line-through">${product.old}</span>}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Zap className="w-4 h-4" /> Buy Now
                </button>
              </div>
              <Link
                to={`/product/${realId}`}
                onClick={() => onOpenChange(false)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
              >
                View full details <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <PurchaseModal product={purchaseProduct} license={purchaseLicense} open={purchaseOpen} onOpenChange={(v) => { setPurchaseOpen(v); if (!v) onOpenChange(false); }} />
    </>
  );
};

export default QuickViewDialog;
