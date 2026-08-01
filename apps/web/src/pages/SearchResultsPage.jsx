import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Clock, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import { PRODUCT_GRID_CLASS } from '../lib/productGrid';
import EmptyState from '../components/EmptyState';
import { NetworkErrorState } from '../components/ErrorState';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { searchCategories } from '../services/categoryRepository';
import { getStorefrontSellers } from '../services/sellerRepository';
import { productsApi } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { POPULAR_SEARCHES } from '../constants';
import { useStore } from '../context/StoreContext';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [value, setValue] = useState(q);
  const { recent, addRecent, clearRecent } = useRecentSearches();
  const { catalogVersion } = useStore();

  useEffect(() => setValue(q), [q]);
  useEffect(() => { if (q.trim()) addRecent(q); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load search results from the production catalog API
  const { data: searchData, loading, error, retry } = useFetch(
    () => productsApi.search(q),
    [q]
  );

  const results = searchData?.products || [];

  const matchedCategories = useMemo(() => {
    if (searchData?.categories?.length) return searchData.categories;
    return searchCategories(q);
  }, [q, catalogVersion, searchData]);

  const matchedArtists = useMemo(() => {
    if (searchData?.artists?.length) return searchData.artists;
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return getStorefrontSellers().filter((a) => a.name.toLowerCase().includes(needle));
  }, [q, catalogVersion, searchData]);

  const goSearch = (term) => navigate(term.trim() ? `/search?q=${encodeURIComponent(term.trim())}` : '/search');

  const submit = (e) => {
    e.preventDefault();
    goSearch(value);
  };

  return (
    <div className="min-h-screen">
      <Seo
        title={q ? `Search: ${q}` : 'Search'}
        description="Search ApnaStore for social accounts, domains, SaaS, source code, websites, and digital tools from verified sellers."
        noIndex
      />
      <Header />
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'Search' }]} />

        <form onSubmit={submit} role="search" className="flex items-center gap-2 max-w-xl bg-white rounded-full px-4 py-3 border border-border mb-6">
          <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search accounts, domains, SaaS, source code…" aria-label="Search" className="bg-transparent outline-none text-sm w-full" />
        </form>

        {!q.trim() ? (
          <div className="max-w-lg space-y-6">
            <div className="bg-white rounded-3xl border border-border p-10 sm:p-12 text-center">
              <h1 className="text-lg font-bold">Search ApnaStore</h1>
              <p className="text-sm text-muted-foreground mt-1.5">Type a product, category, or artist name above to get started.</p>
            </div>

            {recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent searches</p>
                  <button type="button" onClick={clearRecent} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button key={term} type="button" onClick={() => goSearch(term)} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-white border border-border hover:bg-secondary transition-colors">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button key={term} type="button" onClick={() => goSearch(term)} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-white border border-border hover:bg-secondary transition-colors">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" /> {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {loading ? 'Searching…' : <>{results.length} result{results.length === 1 ? '' : 's'} for "<span className="brand-text">{q}</span>"</>}
            </h1>

            {matchedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {matchedCategories.map((c) => (
                  <Link key={c.id} to={`/category/${c.slug}`} className="text-sm font-medium px-4 py-2 rounded-full bg-white border border-border hover:bg-secondary transition-colors">
                    Category: {c.name}
                  </Link>
                ))}
              </div>
            )}

            {matchedArtists.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {matchedArtists.map((a) => (
                  <Link key={a.slug} to={`/seller/${a.slug}`} className="text-sm font-medium px-4 py-2 rounded-full bg-white border border-border hover:bg-secondary transition-colors">
                    Artist: {a.name}
                  </Link>
                ))}
              </div>
            )}

            {error ? (
              <div className="mt-8">
                <NetworkErrorState onRetry={retry} message={error.message} />
              </div>
            ) : loading ? (
              <div className="mt-8">
                <ProductGridSkeleton count={12} className={PRODUCT_GRID_CLASS} />
              </div>
            ) : results.length === 0 ? (
              <div className="mt-10">
                <EmptyState
                  title="No products found"
                  message="Try a different search term, or browse all products instead."
                  actionLabel="Browse the Shop"
                  actionTo="/shop"
                />
              </div>
            ) : (
              <div className={`${PRODUCT_GRID_CLASS} mt-8`}>
                {results.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchResultsPage;
