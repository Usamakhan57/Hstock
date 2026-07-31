import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LayoutGrid, Rows3, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { NetworkErrorState } from '../components/ErrorState';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useFetch } from '../hooks/useFetch';
import { productsApi } from '../services/api';
import { SORT_OPTIONS, PAGE_SIZE } from '../constants';

const ShopPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') === 'top-rated' ? 'Top Rated' : 'Popular');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');

  useEffect(() => {
    const fromUrl = searchParams.get('search');
    if (fromUrl) setQuery(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  const { data: list, loading, error, retry } = useFetch(
    () => productsApi.list({ sort, query }),
    [sort, query]
  );

  const totalPages = Math.max(1, Math.ceil((list?.length || 0) / PAGE_SIZE));
  const paged = (list || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

        <div className="mt-9 flex flex-col gap-4">
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

          <div className="mt-2">
            {loading ? (
              <ProductGridSkeleton
                count={8}
                className={view === 'grid' ? 'grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-stretch' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 items-stretch'}
              />
            ) : error ? (
              <NetworkErrorState onRetry={retry} message="We couldn't load products right now. Please try again." />
            ) : list.length === 0 ? (
              <EmptyState title="No products found" message="Try a different search term to discover more listings." />
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

      <Footer />
    </div>
  );
};

export default ShopPage;
