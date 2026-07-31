import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { X, Star, Download, Zap } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import PurchaseModal from '../components/PurchaseModal';
import { useStore } from '../context/StoreContext';

const ROWS = [
  { key: 'price', label: 'Price', render: (p) => `$${p.price}` },
  { key: 'cat', label: 'Category', render: (p) => p.cat || '—' },
  { key: 'artist', label: 'Seller', render: (p) => p.artist || '—' },
  { key: 'rating', label: 'Rating', render: (p) => (
    <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {p.rating ?? '—'} <span className="text-muted-foreground">({p.reviewCount ?? 0})</span></span>
  ) },
  { key: 'downloads', label: 'Downloads', render: (p) => (
    <span className="inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {((p.downloads ?? 0) / 1000).toFixed(1)}k</span>
  ) },
  { key: 'fileTypes', label: 'File Types', render: (p) => (Array.isArray(p.fileTypes) && p.fileTypes.length ? p.fileTypes.join(', ') : '—') },
  { key: 'dimensions', label: 'Dimensions', render: (p) => p.dimensions || '—' },
  { key: 'version', label: 'Version', render: (p) => p.version || '—' },
];

const ComparePage = () => {
  const { compareList, removeFromCompare, clearCompare, user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [purchaseProduct, setPurchaseProduct] = useState(null);

  const handleBuyNow = (p) => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setPurchaseProduct({ ...p, licenseId: 'personal', licenseName: 'Personal Use' });
  };

  return (
    <div className="min-h-screen">
      <Seo title="Compare Products" description="Compare digital products side by side on HStock." noIndex />
      <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'Compare' }]} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Compare <span className="brand-text">Products</span></h1>
          {compareList.length > 0 && (
            <button onClick={clearCompare} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Clear all</button>
          )}
        </div>
        <p className="text-muted-foreground mt-3">Compare up to 4 products side by side.</p>

        {compareList.length === 0 ? (
          <div className="mt-10 max-w-lg mx-auto">
            <EmptyState title="Nothing to compare yet" message="Tap the compare icon on any product card to add it here." actionLabel="Browse the Shop" actionTo="/shop" />
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-40 sticky left-0 bg-background"></th>
                  {compareList.map((p) => (
                    <th key={p.id} className="p-3 align-top">
                      <div className="bg-white rounded-3xl border border-border soft-shadow p-4 relative">
                        <button
                          onClick={() => removeFromCompare(p.id)}
                          aria-label={`Remove ${p.title} from compare`}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-secondary grid place-items-center hover:bg-border transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <Link to={`/product/${p.id}`} className="block aspect-square rounded-2xl overflow-hidden bg-secondary mb-3">
                          <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
                        </Link>
                        <Link to={`/product/${p.id}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2">{p.title}</Link>
                        <button
                          onClick={() => handleBuyNow(p)}
                          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full brand-gradient text-white hover:opacity-95 transition-opacity"
                        >
                          <Zap className="w-3.5 h-3.5" /> Buy Now
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className="sticky left-0 bg-background pr-4 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">{row.label}</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-3 px-4 text-sm border-t border-border">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />

      <PurchaseModal
        product={purchaseProduct}
        license={purchaseProduct ? { id: purchaseProduct.licenseId, name: purchaseProduct.licenseName, price: purchaseProduct.price } : null}
        open={!!purchaseProduct}
        onOpenChange={(v) => { if (!v) setPurchaseProduct(null); }}
      />
    </div>
  );
};

export default ComparePage;
