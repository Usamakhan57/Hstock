import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import { CategoryCardSkeleton } from '../components/Skeletons';
import { getCategoryTreeForStorefront } from '../services/categoryRepository';
import { getProductCountByCategoryId } from '../services/productRepository';
import { getRolledUpCount } from '../services/categoryTree';
import { useStore } from '../context/StoreContext';

const CategoriesPage = () => {
  const { catalogReady, catalogVersion } = useStore();
  const categories = useMemo(() => {
    const counts = getProductCountByCategoryId();
    return getCategoryTreeForStorefront().map((c) => ({ ...c, count: getRolledUpCount(c, counts) }));
  }, [catalogVersion]);

  const total = categories.reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen">
      <Seo title="Browse Categories" description="Explore digital marketplace categories on ApnaStore — social accounts, domains, websites, SaaS, source code, and more." />
    <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10">
        <Breadcrumbs items={[{ name: 'Categories' }]} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Browse by <span className="brand-text">category</span></h1>
        <p className="text-muted-foreground mt-3 max-w-lg">Explore {total.toLocaleString()}+ listings organized into {categories.length} categories — from social accounts to full source code.</p>

        {!catalogReady ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
            {Array.from({ length: 6 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-10 pb-24">
            <EmptyState title="No categories yet" message="Categories will appear here once the catalog is available." />
          </div>
        ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="group bg-white rounded-3xl p-6 border border-border soft-shadow hover:soft-shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-5"
            >
              <span className="grid place-items-center w-16 h-16 rounded-2xl shrink-0" style={{ background: `${c.color}18`, color: c.color }}>
                <c.icon className="w-8 h-8" strokeWidth={1.8} />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-bold">{c.name}</span>
                <span className="block text-sm text-muted-foreground mt-0.5">{c.count.toLocaleString()} items</span>
              </span>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ))}
        </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CategoriesPage;
