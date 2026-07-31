import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import EmptyState from '../components/EmptyState';
import { NetworkErrorState } from '../components/ErrorState';
import { ProductGridSkeleton } from '../components/Skeletons';
import NotFoundPage from './NotFoundPage';
import { useFetch } from '../hooks/useFetch';
import { productsApi } from '../services/api';
import {
  getCategoryBySlug, getStorefrontCategories, getRootStorefrontCategories, getCategoryAncestors,
} from '../services/categoryRepository';
import { getProductCountByCategoryId } from '../services/productRepository';
import { getDescendants, getRolledUpCount } from '../services/categoryTree';
import { DEFAULT_FILTERS, SORT_OPTIONS, PAGE_SIZE } from '../constants';
import { useStore } from '../context/StoreContext';

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { catalogReady, catalogVersion } = useStore();

  const category = useMemo(() => getCategoryBySlug(slug), [slug, catalogVersion]);
  const allCategories = useMemo(() => getStorefrontCategories(), [catalogVersion]);
  const rootCategories = useMemo(() => getRootStorefrontCategories(), [catalogVersion]);
  const ancestors = useMemo(() => (category ? getCategoryAncestors(category.id) : []), [category]);

  // A category page shows products from itself AND every nested
  // subcategory — a parent like "Digital Products" aggregates Wall Arts,
  // Cliparts, PNG Bundles, etc. instead of showing zero direct matches.
  const categoryNames = useMemo(() => {
    if (!category) return [];
    const descendants = getDescendants(allCategories, category.id);
    return [category.name, ...descendants.map((d) => d.name)];
  }, [category, allCategories]);

  const count = useMemo(() => {
    if (!category) return 0;
    const counts = getProductCountByCategoryId();
    const node = { id: category.id, children: getDescendants(allCategories, category.id).map((d) => ({ id: d.id, children: [] })) };
    return getRolledUpCount(node, counts);
  }, [category, allCategories]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('Popular');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); setQuery(''); setSort('Popular'); setFilters(DEFAULT_FILTERS); }, [slug]);
  useEffect(() => { setPage(1); }, [filters, query, sort]);

  const activeFilters = useMemo(() => ({ ...filters, categoryNames }), [filters, categoryNames]);

  const { data: list, loading, error, retry } = useFetch(
    () => productsApi.list({ filters: activeFilters, sort, query }),
    [activeFilters, sort, query]
  );

  const totalPages = Math.max(1, Math.ceil((list?.length || 0) / PAGE_SIZE));
  const paged = (list || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!catalogReady && !category) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
          <ProductGridSkeleton />
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) return <NotFoundPage />;

  const Icon = category.icon;
  const rootAncestorId = ancestors[0]?.id || category.id;

  const categorySlot = (
    <div className="pb-4 mb-4 border-b border-border">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Jump to category</p>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => navigate('/shop')} className="text-sm px-3.5 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary text-foreground/80 transition-colors">
          All
        </button>
        {rootCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/category/${c.slug}`)}
            className={`text-sm px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${c.id === rootAncestorId ? 'brand-gradient text-white font-semibold' : 'bg-secondary/70 hover:bg-secondary text-foreground/80'}`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Seo title={category.seoTitle || category.name} description={category.metaDescription || `${category.description} ${count.toLocaleString()}+ items, hand-picked and ready to download.`} image={category.ogImage} />
      <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10">
        <Breadcrumbs items={[
          { name: 'Categories', to: '/categories' },
          ...ancestors.map((a) => ({ name: a.name, to: `/category/${a.slug}` })),
          { name: category.name },
        ]} />

        <div className="flex items-center gap-4">
          <span className="grid place-items-center w-14 h-14 rounded-2xl shrink-0" style={{ background: `${category.color}18`, color: category.color }}>
            <Icon className="w-7 h-7" strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{category.name}</h1>
            <p className="text-muted-foreground mt-1">{count.toLocaleString()}+ items in this category</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl">{category.description || `Browse our curated ${category.name.toLowerCase()} collection.`}</p>

        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 shrink-0">
            <FilterSidebar filters={filters} onChange={setFilters} categorySlot={categorySlot} resultCount={list?.length} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1 bg-white rounded-full px-4 py-2.5 border border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search in ${category.name}…`}
                  aria-label="Search products"
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by" className="appearance-none bg-white rounded-full pl-4 pr-10 py-2.5 border border-border text-sm font-medium outline-none cursor-pointer w-full sm:w-auto">
                  {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <NetworkErrorState onRetry={retry} message="We couldn't load this category right now. Please try again." />
            ) : list.length === 0 ? (
              <EmptyState
                title="No products found"
                message={`Try a different search term or filter, or check back soon — new ${category.name.toLowerCase()} assets are added regularly.`}
                secondaryLabel="Reset filters"
                onSecondary={() => { setFilters(DEFAULT_FILTERS); setQuery(''); setSort('Popular'); }}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paged.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="grid place-items-center w-10 h-10 rounded-full border border-border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        aria-current={page === n ? 'page' : undefined}
                        className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${page === n ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      aria-label="Next page"
                      className="grid place-items-center w-10 h-10 rounded-full border border-border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CategoryPage;
