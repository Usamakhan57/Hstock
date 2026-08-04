import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, DollarSign, CalendarDays, Clock, ShieldCheck, UserPlus, UserCheck, Flag, Package } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import { PRODUCT_GRID_CLASS } from '../lib/productGrid';
import ReportModal from '../components/ReportModal';
import { ProductGridSkeleton } from '../components/Skeletons';
import { NetworkErrorState } from '../components/ErrorState';
import {
  getSellerBySlug,
  getSellerProducts,
  loadSellers,
  enrichSellerFromProducts,
} from '../services/sellerRepository';
import { isFollowingSeller, toggleFollowSeller } from '../services/buyerDashboard';
import { useToast } from '../hooks/use-toast';
import { useStore } from '../context/StoreContext';

const SellerProfilePage = () => {
  const { slug } = useParams();
  const { catalogVersion } = useStore();
  const { toast } = useToast();
  const [artist, setArtist] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        await loadSellers();
        if (!alive) return;
        const seller = getSellerBySlug(slug);
        if (!seller) {
          if (alive) {
            setArtist(null);
            setItems([]);
          }
          return;
        }
        const products = await getSellerProducts(seller.slug);
        if (!alive) return;
        setArtist(enrichSellerFromProducts(seller, products));
        setFollowing(isFollowingSeller(seller.slug));
        setItems(products);
      } catch (err) {
        if (alive) setError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, catalogVersion]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Seo title="Seller Store" noIndex />
        <Header />
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
          <ProductGridSkeleton />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
          <NetworkErrorState onRetry={() => window.location.reload()} message={error.message} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col">
        <Seo title="Seller Not Found" description="This seller profile may have been removed or the link is incorrect." noIndex />
        <Header />
        <div className="flex-1 grid place-items-center px-5 py-24 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Seller not found</h1>
            <p className="text-muted-foreground mb-6">This seller profile may have been removed or the link is incorrect.</p>
            <Link to="/shop" className="inline-flex items-center justify-center px-6 py-3 rounded-full brand-gradient text-white font-semibold">Back to Shop</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleToggleFollow = () => {
    toggleFollowSeller(artist);
    setFollowing((prev) => !prev);
    toast({ title: following ? 'Unfollowed' : 'Following', description: artist.name });
  };

  return (
    <div className="min-h-screen">
      <Seo title={`${artist.name} — Seller Store`} description={artist.bio} />
      <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'Sellers', to: '/shop' }, { name: artist.name }]} />

        {/* Store banner + logo */}
        <div className="rounded-3xl overflow-hidden border border-border soft-shadow">
          <div className="relative h-32 sm:h-40 brand-gradient overflow-hidden" aria-hidden="true">
            {artist.banner ? (
              <img src={artist.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle at 15% 30%, #fff, transparent 55%)' }} />
                <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 85% 80%, #fff, transparent 45%)' }} />
              </>
            )}
          </div>
          <div className="bg-white p-6 sm:p-8 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-10">
              {artist.avatar || artist.logo ? (
                <img
                  src={artist.avatar || artist.logo}
                  alt={artist.name}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 border-4 border-white soft-shadow"
                />
              ) : (
                <span className="w-20 h-20 rounded-2xl brand-gradient text-white grid place-items-center text-2xl font-bold shrink-0 border-4 border-white soft-shadow">{artist.initials}</span>
              )}
              <div className="flex-1 pt-2 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black tracking-tight">{artist.name}</h1>
                  {artist.verified && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verified Seller</span>
                  )}
                  {artist.storePromoted && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">Featured Seller</span>
                  )}
                  {artist.storePromoted && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200">Promoted Store</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">{artist.bio || artist.specialty || 'Digital products from a trusted ApnaStore seller.'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  aria-pressed={following}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${following ? 'border border-border hover:bg-secondary' : 'brand-gradient text-white hover:opacity-95'}`}
                >
                  {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} {following ? 'Following' : 'Follow'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  aria-label="Report this seller"
                  className="w-10 h-10 grid place-items-center rounded-full border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About Seller stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-border soft-shadow hover:soft-shadow-lg transition-shadow p-5 text-center">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber-100 mx-auto mb-2"><Star className="w-4.5 h-4.5 fill-amber-400 text-amber-500" /></span>
            <p className="text-lg font-black">{artist.rating != null ? artist.rating : '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Rating</p>
          </div>
          <div className="bg-white rounded-2xl border border-border soft-shadow hover:soft-shadow-lg transition-shadow p-5 text-center">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mx-auto mb-2"><DollarSign className="w-4.5 h-4.5" /></span>
            <p className="text-lg font-black">{Math.round(artist.totalSalesAmount || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Sales</p>
          </div>
          <div className="bg-white rounded-2xl border border-border soft-shadow hover:soft-shadow-lg transition-shadow p-5 text-center">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mx-auto mb-2"><CalendarDays className="w-4.5 h-4.5" /></span>
            <p className="text-lg font-black">{artist.joined || '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Joined</p>
          </div>
          <div className="bg-white rounded-2xl border border-border soft-shadow hover:soft-shadow-lg transition-shadow p-5 text-center">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mx-auto mb-2"><Clock className="w-4.5 h-4.5" /></span>
            <p className="text-sm font-black leading-tight">{artist.responseTime || '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Response Time</p>
          </div>
          <div className="bg-white rounded-2xl border border-border soft-shadow hover:soft-shadow-lg transition-shadow p-5 text-center col-span-2 sm:col-span-1">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mx-auto mb-2"><Package className="w-4.5 h-4.5" /></span>
            <p className="text-lg font-black">{items.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Products</p>
          </div>
        </div>

        <div className="mt-14">
          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/[0.08] px-3 py-1 rounded-full mb-3">Catalog</span>
          <h2 className="text-2xl font-bold mb-6">Products by {artist.name}</h2>
          {items.length === 0 ? (
            <div className="bg-white rounded-3xl border border-border p-16 text-center">
              <p className="text-lg font-semibold">No products listed yet</p>
            </div>
          ) : (
            <div className={PRODUCT_GRID_CLASS}>
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>

        {/* Reviews — backend review list not available; show rating summary only */}
        <div className="mt-14">
          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/[0.08] px-3 py-1 rounded-full mb-3">Feedback</span>
          <h2 className="text-2xl font-bold mb-6">Reviews for {artist.name}</h2>
          <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold">{artist.rating != null ? artist.rating : '—'}</span>
              <div>
                <div className="flex items-center gap-0.5" aria-label={`Rated ${artist.rating ?? 0} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= Math.round(artist.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Based on ratings across {items.length} listing{items.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">No written reviews yet.</p>
          </div>
        </div>
      </div>
      <Footer />
      <ReportModal open={reportOpen} onOpenChange={setReportOpen} subjectType="seller" subjectName={artist.name} />
    </div>
  );
};

export default SellerProfilePage;
