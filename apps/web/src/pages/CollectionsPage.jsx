import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import { CollectionCardSkeleton } from '../components/Skeletons';
import { getStorefrontCollections } from '../services/collectionRepository';
import { useStore } from '../context/StoreContext';

const CollectionsPage = () => {
  const { catalogReady, catalogVersion } = useStore();
  const collections = useMemo(() => getStorefrontCollections(), [catalogVersion]);

  return (
  <div className="min-h-screen">
    <Seo title="Curated Collections" description="Hand-picked digital asset collections built around a theme — shop a whole vibe in one click on HStock." />
    <Header />
    <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10">
        <Breadcrumbs items={[{ name: 'Collections' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Curated <span className="brand-text">collections</span></h1>
      <p className="text-muted-foreground mt-3 max-w-lg">Hand-picked sets of assets built around a theme, so you can shop a whole vibe in one click.</p>

      {!catalogReady ? (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
          {Array.from({ length: 4 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
        </div>
      ) : collections.length === 0 ? (
        <div className="mt-10 pb-24">
          <EmptyState title="No collections yet" message="Curated collections will appear here once published." />
        </div>
      ) : (
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
        {collections.map((c) => (
          <Link
            key={c.slug}
            to={`/shop?search=${encodeURIComponent(c.title)}`}
            className="group relative bg-white rounded-3xl overflow-hidden border border-border soft-shadow hover:soft-shadow-lg transition-all duration-300"
          >
            <div className="relative h-56 overflow-hidden bg-secondary">
              {c.cover ? (
                <img src={c.cover} alt={c.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full brand-gradient opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold">{c.title}</h2>
              <p className="text-sm text-muted-foreground mt-1.5">{c.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-4 group-hover:gap-2.5 transition-all">
                Shop collection <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      )}
    </div>
    <Footer />
  </div>
  );
};

export default CollectionsPage;
