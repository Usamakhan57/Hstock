import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, Star, Zap, Scale, BadgeCheck, PackageCheck, AlertTriangle, Ban, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { licenseCatalog, slugify } from '../data';
import { resolveSellerVerified } from '../services/sellerRepository';
import { getStockStatus } from '../services/productMeta';
import QuickViewDialog from './QuickViewDialog';
import PurchaseModal from './PurchaseModal';

const badgeStyle = {
  Sale: 'bg-accent text-white',
  'Best Seller': 'brand-gradient text-white',
  Featured: 'bg-foreground text-white',
  Premium: 'bg-amber-400 text-foreground',
};

const ProductCard = ({ p }) => {
  const { user, toggleCompare, inCompare, compareList, MAX_COMPARE } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickView, setQuickView] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const realId = p.baseId ?? p.id;
  const compared = inCompare(realId);
  const sellerVerified = resolveSellerVerified(p.artist);
  const stockStatus = getStockStatus(p);

  const fileTypes = Array.isArray(p.fileTypes) ? p.fileTypes : [];
  const productTypeLabel = 'Instant access';
  const defaultLicense = licenseCatalog[p.licenseIds?.[0]] || licenseCatalog.personal;
  const purchaseProduct = { ...p, id: realId };
  const purchaseLicense = {
    id: defaultLicense.id,
    name: defaultLicense.name,
    price: Math.round(p.price * defaultLicense.priceMultiplier * 100) / 100,
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setPurchaseOpen(true);
  };

  const handleToggleCompare = (e) => {
    e.preventDefault();
    if (!compared && compareList.length >= MAX_COMPARE) {
      return;
    }
    toggleCompare({ ...p, id: realId });
  };

  return (
    <article className="group relative overflow-hidden rounded-[1.2rem] border border-border/70 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-border/90">
      <Link to={`/product/${realId}`} className="block relative overflow-hidden bg-secondary aspect-[4/4.2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" aria-label={p.title}>
        <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        {p.badge && <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${badgeStyle[p.badge] || 'bg-white'}`}>{p.badge}</span>}
        {p.featured || p.promoted ? <span className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">HStock</span> : null}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-75 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={(e) => { e.preventDefault(); setQuickView(true); }} className="flex items-center justify-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:bg-white" aria-label={`Quick view ${p.title}`}>
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Quick View
          </button>
          <button type="button" onClick={handleBuyNow} className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-95" aria-label={`Buy ${p.title} now`}>
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </Link>

      <button type="button" aria-label={compared ? 'Remove from compare' : 'Add to compare'} aria-pressed={compared} onClick={handleToggleCompare} className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition-colors ${compared ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
        <Scale className={`h-4 w-4 transition-colors ${compared ? 'fill-primary/10' : ''}`} />
      </button>

      <div className="px-4 pb-4 pt-3.5">
        <div className="mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>{p.cat}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">{productTypeLabel}</span>
        </div>

        <Link to={`/product/${realId}`} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <h3 className="text-[15px] font-bold leading-snug line-clamp-2 transition-colors hover:text-primary">{p.title}</h3>
        </Link>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to={`/seller/${p.sellerSlug || p.artistSlug || slugify(p.artist)}`} className="font-semibold transition-colors hover:text-primary">{p.artist}</Link>
          {sellerVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified seller" />}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {p.rating != null && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" /> {p.rating}</span>}
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">Instant access</span>
          {p.promoted ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700"><Sparkles className="h-3 w-3" /> Promoted</span> : null}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[1.45rem] font-black tracking-tight leading-none">${p.price}</div>
            {p.old && <div className="mt-1 text-sm text-muted-foreground line-through">${p.old}</div>}
          </div>
          {stockStatus && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${stockStatus.tone === 'destructive' ? 'bg-destructive/10 text-destructive' : stockStatus.tone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {stockStatus.tone === 'destructive' ? <Ban className="h-3 w-3" /> : stockStatus.tone === 'warning' ? <AlertTriangle className="h-3 w-3" /> : <PackageCheck className="h-3 w-3" />}
            {stockStatus.label}
          </span>}
        </div>

        {fileTypes.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{fileTypes.slice(0, 2).map((t) => <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">{t}</span>)}</div>}
      </div>

      <QuickViewDialog product={p} open={quickView} onOpenChange={setQuickView} />
      <PurchaseModal product={purchaseProduct} license={purchaseLicense} open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </article>
  );
};

export default ProductCard;
