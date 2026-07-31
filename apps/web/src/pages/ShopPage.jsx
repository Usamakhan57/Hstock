import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Rows3, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import EmptyState from '../components/EmptyState';
import { NetworkErrorState } from '../components/ErrorState';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useFetch } from '../hooks/useFetch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { productsApi } from '../services/api';
import { getRootStorefrontCategories, getCategoryBySlug } from '../services/categoryRepository';
import { getCollectionBySlug } from '../services/collectionRepository';
import { getSellerBySlug } from '../services/sellerRepository';
import { DEFAULT_FILTERS, SORT_OPTIONS, SORT_ALIASES, PAGE_SIZE } from '../constants';
import { useStore } from '../context/StoreContext';

function resolveSort(value) {
  if (!value) return 'Most Popular';
  if (value === 'top-rated' || value === 'best-rated') return 'Best Rated';
  if (value === 'newest') return 'Newest';
  if (value === 'oldest') return 'Oldest';
  if (value === 'price-asc') return 'Price: Low to High';
  if (value === 'price-desc') return 'Price: High to Low';
  if (value === 'popular' || value === 'most-popular') return 'Most Popular';
  return SORT_ALIASES[value] || (SORT_OPTIONS.includes(value) ? value : 'Most Popular');
}

const ShopPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { catalogVersion } = useStore();

  const [query, setQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [sort, setSort] = useState(resolveSort(searchParams.get('sort')));
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  const collectionSlug = searchParams.get('collection');
  const categorySlug = searchParams.get('category');
  const sellerSlug = searchParams.get('seller');

  const collection = useMemo(
    () => (collectionSlug ? getCollectionBySlug(collectionSlug) : null),
    [collectionSlug, catalogVersion],
  );
  const category = useMemo(
    () => (categorySlug ? getCategoryBySlug(categorySlug) : null),
    [categorySlug, catalogVersion],
  );
  const seller = useMemo(
    () => (sellerSlug ? getSellerBySlug(sellerSlug) : null),
    [sellerSlug, catalogVersion],
  );
  const rootCategories = useMemo(() => getRootStorefrontCategories(), [catalogVersion]);

  useEffect(() => {
    const fromUrl = searchParams.get('search') || searchParams.get('q');
    if (fromUrl != null) setQuery(fromUrl);
    if (searchParams.get('sort')) setSort(resolveSort(searchParams.get('sort')));
  }, [searchParams]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      collectionId: collection?.id || null,
      categoryId: category?.id || null,
      sellerId: seller?.id || null,
      category: category?.name || 'All',
    }));
  }, [collection?.id, category?.id, seller?.id, category?.name]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sort, filters]);

  const activeFilters = useMemo(() => ({
    ...filters,
    collectionId: collection?.id || filters.collectionId,
    categoryId: category?.id || filters.categoryId,
    sellerId: seller?.id || filters.sellerId,
  }), [filters, collection?.id, category?.id, seller?.id]);

  const { data: list, loading, error, retry } = useFetch(
    () => productsApi.list({ filters: activeFilters, sort, query: debouncedQuery }),
    [activeFilters, sort, debouncedQuery]
  );

  const totalPages = Math.max(1, Math.ceil((list?.length || 0) / PAGE_SIZE));
  const paged = (list || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categorySlot = (
    <div className="pb-4 mb-4 border-b border-border">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Category</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className={`text-sm px-3.5 py-1.5 rounded-full transition-colors ${!categorySlug ? 'brand-gradient text-white font-semibold' : 'bg-secondary/70 hover:bg-secondary text-foreground/80'}`}
        >
          All
        </button>
        {rootCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/shop?category=${encodeURIComponent(c.slug)}`)}
            className={`text-sm px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${c.slug === categorySlug ? 'brand-gradient text-white font-semibold' : 'bg-secondary/70 hover:bg-secondary text-foreground/80'}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {(collection || seller) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {collection ? <>Collection: <span className="font-semibold text-foreground">{collection.title}</span></> : null}
          {collection && seller ? ' · ' : null}
          {seller ? <>Seller: <span className="font-semibold text-foreground">{seller.name}</span></> : null}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Shop All Digital Products"
        description="Browse thousands of premium social accounts, domains, SaaS, and source code from verified sellers."
      />
      <Header />

      <div className="mx-auto max-w-[92rem] px-5 lg:px-8 pt-10">
        <Breadcrumbs items={[{ name: 'Shop' }]} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Shop the <span className="brand-text">marketplace</span>
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Browse premium listings across every category. Search, sort, and buy with escrow protection.
        </p>

        <div className="mt-9 flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 shrink-0">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              categorySlot={categorySlot}
              resultCount={list?.length}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the marketplace…"
                  aria-label="Search products"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sort by"
                    className="w-full appearance-none rounded-full border border-border bg-white py-2.5 pl-4 pr-10 text-sm font-medium outline-none cursor-pointer sm:w-auto"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="hidden items-center gap-0.5 rounded-full border border-border bg-white p-1 sm:flex shrink-0">
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                    className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${view === 'grid' ? 'brand-gradient text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    aria-label="List view"
                    aria-pressed={view === 'list'}
                    className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${view === 'list' ? 'brand-gradient text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                  >
                    <Rows3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <ProductGridSkeleton
                  count={8}
                  className={view === 'grid' ? 'grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-stretch' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 items-stretch'}
                />
              ) : error ? (
                <NetworkErrorState onRetry={retry} message="We couldn't load products right now. Please try again." />
              ) : !list || list.length === 0 ? (
                <EmptyState
                  title="No products found"
                  message="Try a different search term or filter to discover more listings."
                  secondaryLabel="Reset filters"
                  onSecondary={() => {
                    setFilters({ ...DEFAULT_FILTERS });
                    setQuery('');
                    setSort('Most Popular');
                    navigate('/shop');
                  }}
                />
              ) : (
                <>
                  <div className={view === 'grid' ? 'grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-stretch' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 items-stretch'}>
                    {paged.map((p) => (
                      <ProductCard key={p.id} p={p} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          aria-current={page === n ? 'page' : undefined}
                          className={`h-10 w-10 rounded-full text-sm font-semibold transition-colors ${page === n ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Next page"
                        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ShopPage;
