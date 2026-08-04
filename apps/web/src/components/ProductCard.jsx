import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Hand, Heart, Zap, BadgeCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { slugify } from '../data';
import { resolveSellerVerified } from '../services/sellerRepository';
import { getStockStatus, getDeliveryTime, isManualHandover } from '../services/productMeta';
import QuickViewDialog from './QuickViewDialog';

const ProductCard = ({ p }) => {
  const { toggleWishlist, inWishlist } = useStore();
  const [quickView, setQuickView] = useState(false);

  const realId = p.baseId ?? p.id;
  const wished = inWishlist(realId);
  const sellerName = p.seller?.name || p.sellerName || p.artist || 'Seller';
  const sellerSlug = p.sellerSlug || p.artistSlug || p.seller?.slug || slugify(sellerName);
  const sellerVerified = p.verifiedSeller || p.seller?.verified || resolveSellerVerified(sellerName);
  const stockStatus = getStockStatus(p);
  const manualDelivery = isManualHandover(p);
  const instantAccess = !manualDelivery && getDeliveryTime(p).toLowerCase().includes('instant');
  const thumbnail = p.img || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : null);
  const subtitle = (
    p.shortDescription ||
    p.description ||
    p.cat ||
    p.category?.name ||
    p.category ||
    ''
  );

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

  const priceValue = Number(p.price || 0);
  const priceLabel = `$${priceValue.toFixed(priceValue % 1 === 0 ? 0 : 2)}`;
  const cleanSubtitle = String(subtitle)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
      data-testid={`product-card-${realId}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Link
          to={`/product/${realId}`}
          className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
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
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-start justify-between gap-1.5 p-1.5">
          <div className="flex min-w-0 flex-wrap gap-1">
            {manualDelivery ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                <Hand className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                Manual
              </span>
            ) : instantAccess ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                <Zap className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                Instant Access
              </span>
            ) : null}
            {p.featured === true ? (
              <span className="rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                Featured
              </span>
            ) : null}
            {p.storePromoted || p.seller?.storePromoted ? (
              <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                Promoted
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wished}
            data-testid={`wishlist-btn-${realId}`}
            className={`pointer-events-auto grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/70 bg-white/95 text-foreground shadow-sm backdrop-blur transition-all duration-200 hover:scale-105 hover:text-rose-500 ${
              wished ? 'text-rose-500' : 'text-foreground/70'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${wished ? 'fill-rose-500' : ''}`} aria-hidden="true" />
          </button>
        </div>

        {stockStatus ? (
          <span
            className={`pointer-events-none absolute bottom-1.5 left-1.5 z-[2] rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm ${
              stockStatus.tone === 'destructive'
                ? 'bg-red-500'
                : stockStatus.tone === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
            }`}
          >
            {stockStatus.label}
          </span>
        ) : null}

        <div className="pointer-events-none absolute inset-0 z-[1] hidden items-center justify-center bg-slate-900/0 opacity-0 transition-all duration-300 group-hover:bg-slate-900/35 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={openQuickView}
            data-testid={`quick-view-${realId}`}
            className="pointer-events-auto inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-md transition-all duration-300 group-hover:translate-y-0 hover:bg-white"
            aria-label={`Quick view ${p.title}`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Quick View
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <Link
          to={`/product/${realId}`}
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {p.title}
          </h3>
        </Link>

        {cleanSubtitle ? (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            {cleanSubtitle}
          </p>
        ) : null}

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>by</span>
          <Link
            to={`/seller/${sellerSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-semibold text-foreground/80 transition-colors hover:text-primary"
          >
            {sellerName}
          </Link>
          {sellerVerified ? (
            <BadgeCheck className="h-3 w-3 shrink-0 text-primary" aria-label="Verified seller" />
          ) : null}
          {p.storePromoted || p.seller?.storePromoted ? (
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
              Featured Seller
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold leading-none tracking-tight text-emerald-600 sm:text-lg">
              {priceLabel}
            </div>
            {p.old != null ? (
              <div className="mt-0.5 text-[10px] text-muted-foreground line-through">${p.old}</div>
            ) : null}
          </div>
          <Link
            to={`/product/${realId}`}
            data-testid={`view-product-${realId}`}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            aria-label={`View ${p.title}`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View
          </Link>
        </div>
      </div>

      <QuickViewDialog product={p} open={quickView} onOpenChange={setQuickView} />
    </article>
  );
};

export default ProductCard;
