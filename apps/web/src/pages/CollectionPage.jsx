import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { productsApi } from '../services/api';
import { getCollectionBySlug } from '../services/collectionRepository';
import { DEFAULT_FILTERS, SORT_OPTIONS, PAGE_SIZE } from '../constants';
import { useStore } from '../context/StoreContext';

const CollectionPage = () => {
  const { slug } = useParams();
  const { catalogReady, catalogVersion } = useStore();

  const collection = useMemo(() => getCollectionBySlug(slug), [slug, catalogVersion]);

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [sort, setSort] = useState('Most Popular');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setQuery('');
    setSort('Most Popular');
    setFilters({ ...DEFAULT_FILTERS });
  }, [slug]);

  useEffect(() => { setPage(1); }, [filters, debouncedQuery, sort]);

  const activeFilters = useMemo(() => ({
    ...filters,
    collectionId: collection?.id || null,
  }), [filters, collection?.id]);

  const { data: list, loading, error, retry } = useFetch(
    () => (collection ? productsApi.list({ filters: activeFilters, sort, query: debouncedQuery }) : Promise.resolve([])),
    [activeFilters, sort, debouncedQuery, collection?.id]
  );

  const totalPages = Math.max(1, Math.ceil((list?.length || 0) / PAGE_SIZE));
  const paged = (list || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!catalogReady && !collection) {
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

  if (!collection) return <NotFoundPage />;

  return (
    <div className="min-h-screen">
      <Seo
        title={collection.title}
        description={collection.description || `Browse the ${collection.title} collection on HStock.`}
        image={collection.cover || collection.image}
      />
      <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[
          { name: 'Collections', to: '/collections' },
          { name: collection.title },
        ]} />

        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{collection.title}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          {collection.description || `Hand-picked products in the ${collection.title} collection.`}
        </p>

        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 shrink-0">
            <FilterSidebar filters={filters} onChange={setFilters} resultCount={list?.length} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1 bg-white rounded-full px-4 py-2.5 border border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search in ${collection.title}…`}
                  aria-label="Search products"
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort by"
                  className="appearance-none bg-white rounded-full pl-4 pr-10 py-2.5 border border-border text-sm font-medium outline-none cursor-pointer w-full sm:w-auto"
                >
                  {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <NetworkErrorState onRetry={retry} message="We couldn't load this collection right now. Please try again." />
            ) : !list || list.length === 0 ? (
              <EmptyState
                title="No products found"
                message="Try a different search term or filter, or check back soon for new listings in this collection."
                secondaryLabel="Reset filters"
                onSecondary={() => { setFilters({ ...DEFAULT_FILTERS }); setQuery(''); setSort('Most Popular'); }}
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

export default CollectionPage;
