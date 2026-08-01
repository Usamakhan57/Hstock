import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, Heart, Star, Zap, BadgeCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { licenseCatalog, slugify } from '../data';
import { resolveSellerVerified } from '../services/sellerRepository';
import { getStockStatus, getDeliveryTime, isManualHandover } from '../services/productMeta';
import { formatSoldCount } from '../lib/formatSoldCount';
import QuickViewDialog from './QuickViewDialog';
import PurchaseModal from './PurchaseModal';

function RatingStars({ rating }) {
  const value = Number.isFinite(Number(rating)) ? Math.max(0, Math.min(5, Number(rating))) : 0;
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = value >= i + 1 || (value > i && value < i + 1 && value - i >= 0.5);
        return (
          <Star
            key={i}
            className={`h-3 w-3 ${filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`}
          />
        );
      })}
    </span>
  );
}

const ProductCard = ({ p }) => {
  const {
    user,
    toggleWishlist,
    inWishlist,
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickView, setQuickView] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const realId = p.baseId ?? p.id;
  const wished = inWishlist(realId);
  const sellerName = p.seller?.name || p.sellerName || p.artist || 'Seller';
  const sellerSlug = p.sellerSlug || p.artistSlug || p.seller?.slug || slugify(sellerName);
  const sellerVerified = p.verifiedSeller || p.seller?.verified || resolveSellerVerified(sellerName);
  const stockStatus = getStockStatus(p);
  const instantAccess = !isManualHandover(p) && getDeliveryTime(p).toLowerCase().includes('instant');
  const categoryLabel = p.cat || p.category?.name || p.category || null;
  const soldLabel = formatSoldCount(p.soldCount ?? p.salesCount ?? p.downloads);
  const ratingValue = p.rating != null ? Number(p.rating) : null;
  const reviewCount = p.reviewCount != null ? Number(p.reviewCount) : 0;
  const thumbnail = p.img || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : null);

  const defaultLicense = licenseCatalog[p.licenseIds?.[0]] || licenseCatalog.personal;
  const purchaseProduct = { ...p, id: realId };
  const purchaseLicense = {
    id: defaultLicense.id,
    name: defaultLicense.name,
    price: Math.round(Number(p.price || 0) * defaultLicense.priceMultiplier * 100) / 100,
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setPurchaseOpen(true);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({ ...p, id: realId });
  };

  const openQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickView(true);
  };

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.22)]">
      <Link
        to={`/product/${realId}`}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={p.title}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
            No image
          </div>
        )}

        {p.featured === true && (
          <span className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            Featured
          </span>
        )}

        <div className="absolute right-2.5 top-2.5 z-[3] flex items-start gap-1.5">
          {stockStatus && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
                stockStatus.tone === 'destructive'
                  ? 'bg-red-500 text-white'
                  : stockStatus.tone === 'warning'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-900/80 text-white backdrop-blur-sm'
              }`}
            >
              {stockStatus.label}
            </span>
          )}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wished}
            className={`grid h-8 w-8 place-items-center rounded-full bg-white/95 text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:scale-105 hover:text-rose-500 ${
              wished ? 'text-rose-500' : ''
            }`}
          >
            <Heart className={`h-4 w-4 ${wished ? 'fill-rose-500' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-slate-900/0 opacity-0 transition-all duration-300 group-hover:bg-slate-900/35 group-hover:opacity-100">
          <button
            type="button"
            onClick={openQuickView}
            className="pointer-events-auto inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-md transition-all duration-300 group-hover:translate-y-0 hover:bg-white"
            aria-label={`Quick view ${p.title}`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Quick View
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-3.5 pb-4 pt-3">
        <Link
          to={`/product/${realId}`}
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {p.title}
          </h3>
        </Link>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {categoryLabel ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
              {categoryLabel}
            </span>
          ) : null}
          {instantAccess ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              <Zap className="h-3 w-3" aria-hidden="true" />
              Instant Access
            </span>
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <RatingStars rating={ratingValue ?? 0} />
          {ratingValue != null ? (
            <span className="font-semibold text-foreground">{ratingValue.toFixed(1)}</span>
          ) : null}
          {reviewCount > 0 ? <span>({reviewCount})</span> : null}
          <span className="text-border">·</span>
          <span className="font-medium text-foreground/80">{soldLabel}</span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-[1.35rem] font-black leading-none tracking-tight text-emerald-600">
                ${Number(p.price || 0).toFixed(Number(p.price || 0) % 1 === 0 ? 0 : 2)}
              </div>
              {p.old != null && (
                <div className="mt-1 text-xs text-muted-foreground line-through">${p.old}</div>
              )}
            </div>
            <button
              type="button"
              onClick={handleBuyNow}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-sm transition-all duration-300 hover:opacity-95 group-hover:opacity-100"
              aria-label={`Buy ${p.title} now`}
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span>by</span>
            <Link
              to={`/seller/${sellerSlug}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground transition-colors hover:text-primary"
            >
              {sellerName}
            </Link>
            {sellerVerified ? (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified seller" />
            ) : null}
          </div>
        </div>
      </div>

      <QuickViewDialog product={p} open={quickView} onOpenChange={setQuickView} />
      <PurchaseModal product={purchaseProduct} license={purchaseLicense} open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </article>
  );
};

export default ProductCard;
