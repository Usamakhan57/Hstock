import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, Star, Download, Facebook, Twitter, Link2, Check, X as XIcon, MessageCircle, Flag,
  ShieldCheck, AlertTriangle,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { ProductDetailSkeleton } from '../components/Skeletons';
import { NetworkErrorState } from '../components/ErrorState';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import PurchaseModal from '../components/PurchaseModal';
import ReportModal from '../components/ReportModal';
import { slugify } from '../data';
import { getStorefrontSellers } from '../services/sellerRepository';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';
import { productsApi } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { trackProductView, getRecentCategories } from '../services/recentlyViewed';
import { getDeliveryTime, getStockStatus } from '../services/productMeta';
import { SITE } from '../constants';

const RatingStars = ({ value, size = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`${size} ${n <= Math.round(value ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
    ))}
  </div>
);

/**
 * normaliseProduct maps any product shape (legacy mock OR admin/seller
 * -created via the upgraded Product Editor) to a guaranteed-safe object.
 * Every field accessed in render is filled with a safe fallback (null/[]
 * /false) rather than fabricated text, so the page can show/hide rows
 * based on what the product actually has instead of hardcoding content.
 */
function normaliseProduct(p) {
  if (!p) return null;

  const thumbnail = p.thumbnail || p.img || '';

  // Build images array: prefer images[], then gallery[], then thumbnail
  let images = [];
  if (Array.isArray(p.images) && p.images.length > 0) images = p.images;
  else if (Array.isArray(p.gallery) && p.gallery.length > 0) images = p.gallery;
  if (images.length === 0 && thumbnail) images = [thumbnail];
  if (images.length === 0) images = [''];

  // Artist / seller
  const artistName = p.artist || p.brandName || p.brand || 'ApnaStore Marketplace';
  const knownArtist = getStorefrontSellers().find((a) => a.name === artistName || a.slug === p.sellerSlug);
  const artistSlug = p.sellerSlug || p.artistSlug || knownArtist?.slug || slugify(artistName);
  const features = Array.isArray(p.features) && p.features.length
    ? p.features
    : (typeof p.whatsIncluded === 'string' && p.whatsIncluded
      ? p.whatsIncluded.split('\n').map((s) => s.trim()).filter(Boolean)
      : []);
  const specifications = p.specifications && typeof p.specifications === 'object'
    ? Object.entries(p.specifications).filter(([, v]) => v != null && v !== '')
    : [];

  return {
    id: p.id,
    title: p.title || 'Untitled Product',
    slug: p.slug || slugify(p.title || String(p.id)),
    cat: p.cat || p.categoryId || 'Others',
    catSlug: p.catSlug || null,
    description: p.description || 'No description available.',
    shortDescription: p.shortDescription || null,
    img: thumbnail || images[0] || '',
    images,
    price: p.price ?? 0,
    old: p.old ?? null,
    rating: p.rating ?? null,
    reviewCount: p.reviewCount ?? 0,
    downloads: p.downloads ?? 0,
    views: p.views ?? null,
    artist: artistName,
    artistSlug,
    knownArtist: knownArtist || null,
    verifiedSeller: !!p.verifiedSeller || !!knownArtist?.verified,
    whatsIncluded: typeof p.whatsIncluded === 'string' ? p.whatsIncluded : '',
    features,
    specifications,
    fileTypes: Array.isArray(p.fileTypes) ? p.fileTypes : [],
    deliveryType: p.deliveryType || null,
    assetPlatform: p.assetPlatform || null,
    dimensions: p.dimensions || null,
    resolution: p.resolution || null,
    orientation: p.orientation || null,
    colorSpace: p.colorSpace || null,
    requirements: p.requirements || null,
    version: p.version || null,
    changelog: p.changelog || null,
    fileSize: p.fileSize || null,
    supportedSoftware: Array.isArray(p.supportedSoftware) ? p.supportedSoftware : [],
    compatibleVersions: Array.isArray(p.compatibleVersions) ? p.compatibleVersions : [],
    liveDemoUrl: p.liveDemoUrl || null,
    documentationPdf: p.documentationPdf || null,
    zipFile: p.zipFile || null,
    downloadFiles: Array.isArray(p.downloadFiles) ? p.downloadFiles : [],
    additionalFiles: Array.isArray(p.additionalFiles) ? p.additionalFiles : [],
    faqs: Array.isArray(p.faqs) ? p.faqs : [],
    badge: p.badge || null,
    featured: !!p.featured,
    tags: Array.isArray(p.tags) ? p.tags : [],
    updatedAt: p.updatedAt || p.createdAt || null,

    // Licensing — new multi-license schema (Section 4 of the product editor)
    licenses: Array.isArray(p.licenses) ? p.licenses.filter((l) => l && l.enabled) : [],
    licenseIds: Array.isArray(p.licenseIds) ? p.licenseIds : [],

    // Shipping — productType is stored inside the shipping object by the
    // Product Editor, but mapAdminToStorefront also surfaces it at the top
    // level for convenience. Read both so we never miss a physical product.
    productType: p.productType || p.shipping?.productType || 'digital',
    // Preserve the full shipping object regardless of productType so
    // isPhysicalItem() / getItemShippingInfo() always have their data.
    shipping: p.shipping && typeof p.shipping === 'object' ? p.shipping : null,

    // Inventory
    sku: p.sku || null,
    unlimitedStock: p.unlimitedStock ?? null,
    stock: p.stock ?? null,
    lowStockThreshold: p.lowStockThreshold ?? null,
    barcode: p.barcode || null,

    // SEO (read-only here — used for meta tags, not displayed as content)
    seoTitle: p.seoTitle || null,
    metaDescription: p.metaDescription || null,
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
  };
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, toggleCompare, inCompare, compareList, MAX_COMPARE } = useStore();
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const { data: rawProduct, loading, error, retry } = useFetch(() => productsApi.get(id), [id]);

  const product = useMemo(() => normaliseProduct(rawProduct), [rawProduct]);

  const displayPrice = product?.price ?? 0;

  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [product?.id]);

  // IMPORTANT: this hook must run on every render, in the same position,
  // regardless of loading/not-found state below — React requires hooks to
  // be called unconditionally. Guard the fetcher body instead of skipping
  // the hook call itself (previously this was declared after the early
  // `return`s for loading/not-found, which changed the hook count between
  // renders and crashed the page with "Rendered more hooks than during the
  // previous render").
  const { data: related = [] } = useFetch(
    () => (product ? productsApi.related(product, 4) : Promise.resolve([])),
    [product?.id, product?.cat]
  );

  const { data: similar = [] } = useFetch(
    () => (product ? productsApi.similar(product, 4) : Promise.resolve([])),
    [product?.id, product?.categoryId]
  );

  const { data: recommended = [] } = useFetch(
    () => (product ? productsApi.recommended(getRecentCategories(), product.id, 6) : Promise.resolve([])),
    [product?.id]
  );

  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (product) trackProductView(product);
  }, [product?.id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-8 pb-24">
          <ProductDetailSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (error && error.status !== 404) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-8 pb-24">
          <NetworkErrorState onRetry={retry} message={error.message || "We couldn't load this product right now."} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 grid place-items-center px-5 py-24 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Product not found</h1>
            <p className="text-muted-foreground mb-6">This item may have been removed or the link is incorrect.</p>
            <Link to="/shop" className="inline-flex items-center justify-center px-6 py-3 rounded-full brand-gradient text-white font-semibold">Back to Shop</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const compared = inCompare(product.id);

  const handleToggleCompare = () => {
    if (!compared && compareList.length >= MAX_COMPARE) {
      toast({ title: 'Compare list is full', description: `You can compare up to ${MAX_COMPARE} products at a time.` });
      return;
    }
    toggleCompare(product);
    toast({ title: compared ? 'Removed from compare' : 'Added to compare', description: product.title });
  };

  const totalPrice = Math.round(displayPrice * quantity * 100) / 100;
  const canIncreaseQuantity = product.unlimitedStock || product.stock == null || quantity < (product.stock ?? 1);
  const purchaseProduct = {
    id: product.id,
    title: product.title,
    img: product.img,
    cat: product.cat,
    artist: product.artist,
    artistSlug: product.artistSlug,
    price: totalPrice,
    unitPrice: displayPrice,
    productType: product.productType,
    quantity,
  };
  const purchaseLicense = { id: null, name: null, price: totalPrice };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setPurchaseOpen(true);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied to clipboard' });
    } catch {
      toast({ title: 'Could not copy link', variant: 'destructive' });
    }
  };

  // Clamp activeImage to valid index range
  const clampedImage = Math.min(activeImage, product.images.length - 1);
  const currentImageSrc = product.images[clampedImage] || product.img || '';

  const hasInventoryData = product.sku || product.unlimitedStock != null || product.stock != null;
  const lowStock = !product.unlimitedStock && product.stock != null && product.lowStockThreshold != null && product.stock <= product.lowStockThreshold;
  const outOfStock = !product.unlimitedStock && product.stock != null && product.stock <= 0;
  const stockStatus = getStockStatus(product);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    brand: { '@type': 'Brand', name: product.artist },
    ...(product.rating != null ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
      },
    } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE?.url || ''}/product/${product.id}`,
      priceCurrency: 'USD',
      price: displayPrice,
      availability: outOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen">
      <Seo
        title={product.title}
        description={product.description}
        image={product.img}
        type="product"
        jsonLd={productJsonLd}
      />
      <Header />

      <main id="main-content" className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-8">
        <Breadcrumbs
          className="mb-6"
          items={[
            { name: 'Shop', to: '/shop' },
            { name: product.cat, to: `/category/${product.catSlug || slugify(product.cat)}` },
            { name: product.title },
          ]}
        />

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10">
          <div className="lg:sticky lg:top-[7.5rem] lg:self-start">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block w-full aspect-[4/4.25] rounded-[1.4rem] overflow-hidden bg-secondary border border-border cursor-zoom-in"
              aria-label="Click to zoom"
            >
              {currentImageSrc ? (
                <img src={currentImageSrc} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
              )}
            </button>

            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5 lg:mx-0 lg:px-0">
                {product.images.map((src, i) => (
                  <button
                    key={(src || '') + i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${activeImage === i ? 'border-primary' : 'border-border/60 opacity-70 hover:opacity-100 hover:border-border'}`}
                    aria-label={`View image ${i + 1}`}
                    aria-current={activeImage === i}
                  >
                    {src ? (
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span>{product.cat}</span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{getDeliveryTime(product)}</span>
              {product.badge && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{product.badge}</span>}
            </div>

            <h1 className="mt-3 text-3xl md:text-4xl lg:text-[2.6rem] font-black tracking-tight leading-[1.08]">{product.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-1">by <Link to={`/seller/${product.artistSlug}`} className="font-semibold text-foreground hover:text-primary">{product.artist}</Link></span>
              {product.verifiedSeller && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verified</span>
              )}
              {product.rating != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {product.rating}</span>
              )}
              <span className="rounded-full bg-secondary px-2.5 py-1">{product.reviewCount || 0} reviews</span>
            </div>

            <p className="max-w-3xl mt-5 text-sm leading-7 text-foreground/80 line-clamp-3">{product.shortDescription || product.description}</p>

            <div className="mt-5 rounded-[1.25rem] border border-border bg-white p-5 sm:p-6 lg:sticky lg:top-[7.5rem]">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">${displayPrice.toFixed(2)}</span>
                {product.old && (
                  <span className="text-lg text-muted-foreground line-through">${product.old}</span>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-5 text-sm">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Quantity</span>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-9 h-9 grid place-items-center rounded-2xl border border-border bg-white text-foreground transition-colors disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-12 h-9 grid place-items-center rounded-2xl border border-border text-sm font-semibold">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => canIncreaseQuantity && setQuantity((q) => q + 1)}
                      disabled={!canIncreaseQuantity}
                      className="w-9 h-9 grid place-items-center rounded-2xl border border-border bg-white text-foreground transition-colors disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-semibold text-foreground">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                {!product.unlimitedStock && product.stock != null && (
                  <p className="mt-3 text-xs text-muted-foreground">{product.stock} available</p>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-border p-5">
                <h3 className="font-bold text-sm mb-3">{getDeliveryTime(product)}</h3>
                <p className="text-sm text-muted-foreground">Your purchase unlocks access after checkout, with seller handover protection where required.</p>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full brand-gradient text-white font-semibold hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" /> {outOfStock ? 'Out of stock' : `Buy Now — $${totalPrice.toFixed(2)}`}
                </button>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" /> Secure purchase flow entry — payment comes next.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-border bg-secondary/20 p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Product details</p>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
                <div className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-sm font-semibold mb-2">Description</p>
                  <p>{product.description}</p>
                </div>

                {product.features.length > 0 && (
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-sm font-semibold mb-2">Features</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {product.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.specifications.length > 0 && (
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-sm font-semibold mb-2">Specifications</p>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {product.specifications.map(([key, value]) => (
                        <div key={key} className="rounded-xl bg-secondary/50 px-3 py-2">
                          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{key}</dt>
                          <dd className="text-sm font-medium text-foreground mt-0.5">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {(product.knownArtist || product.artist) && (
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-sm font-semibold mb-2">Seller information</p>
                    <p className="text-sm">
                      <Link to={`/seller/${product.artistSlug}`} className="font-semibold text-primary hover:underline">{product.artist}</Link>
                      {product.verifiedSeller ? ' · Verified seller' : ''}
                    </p>
                    {product.knownArtist?.bio && (
                      <p className="mt-2 text-sm text-muted-foreground">{product.knownArtist.bio}</p>
                    )}
                  </div>
                )}

                {product.supportedSoftware.length > 0 && (
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-sm font-semibold mb-2">Compatible software</p>
                    <p className="text-sm text-muted-foreground">{product.supportedSoftware.join(', ')}</p>
                  </div>
                )}

                {product.faqs.length > 0 ? (
                  <div className="rounded-2xl border border-border bg-white/70 p-4 sm:p-5">
                    <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {product.faqs.map((faq, i) => (
                        <div key={(faq?.question || '') + i} className="rounded-xl border border-border/80 bg-white/80 p-3">
                          <p className="text-sm font-semibold text-foreground">{faq?.question}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{faq?.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Rating summary — review list API is not available yet */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-6">Reviews & rating</h2>
          <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold">{product.rating != null ? product.rating : '—'}</span>
              <div>
                <RatingStars value={product.rating ?? 0} />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {product.reviewCount > 0
                    ? `Based on ${product.reviewCount} review${product.reviewCount === 1 ? '' : 's'}`
                    : 'No reviews yet'}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Detailed reviews will appear here once available.</p>
          </div>
        </div>

        {/* Related products */}
        {Array.isArray(related) && related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* Similar products */}
        {(() => {
          const similarOnly = (Array.isArray(similar) ? similar : [])
            .filter((p) => !(Array.isArray(related) && related.some((r) => String(r.id) === String(p.id))));
          if (!similarOnly.length) return null;
          return (
            <div className="mt-20">
              <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {similarOnly.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>
          );
        })()}

        {/* Recommended for you */}
        {Array.isArray(recommended) && recommended.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              {recommended.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* Recently viewed */}
        <RecentlyViewedSection excludeId={product.id} />
      </main>

      <div className="h-16" />
      <Footer />

      <ReportModal open={reportOpen} onOpenChange={setReportOpen} subjectType="product" subjectName={product.title} />
      <PurchaseModal product={purchaseProduct} license={purchaseLicense} open={purchaseOpen} onOpenChange={setPurchaseOpen} />

      {/* Lightbox */}
      {lightboxOpen && currentImageSrc && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] grid place-items-center p-8"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoom"
            className="absolute top-6 right-6 w-10 h-10 grid place-items-center rounded-full bg-white text-foreground"
          >
            <XIcon className="w-5 h-5" />
          </button>
          <img
            src={currentImageSrc}
            alt={product.title}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
