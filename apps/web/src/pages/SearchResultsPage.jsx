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
import { useStore } from '../context/StoreContext';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [value, setValue] = useState(q);
  const { recent, addRecent, clearRecent } = useRecentSearches();
  const { catalogVersion } = useStore();
  const { data: popularTagsDoc } = useCms(CMS_KEYS.POPULAR_TAGS);
  const popularSearches = useMemo(() => (
    Array.isArray(popularTagsDoc?.tags)
      ? [...popularTagsDoc.tags]
        .filter((t) => t?.enabled !== false && t?.label)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((t) => t.label)
      : []
  ), [popularTagsDoc]);

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

  const matchedSellers = useMemo(() => {
    const fromSearch = searchData?.sellers?.length
      ? searchData.sellers
      : (searchData?.artists || []);
    if (fromSearch.length) return fromSearch;
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return getStorefrontSellers().filter((seller) => seller.name.toLowerCase().includes(needle));
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
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search any product..." aria-label="Search" className="bg-transparent outline-none text-sm w-full" />
        </form>

        {!q.trim() ? (
          <div className="max-w-lg space-y-6">
            <div className="bg-white rounded-3xl border border-border p-10 sm:p-12 text-center">
              <h1 className="text-lg font-bold">Search ApnaStore</h1>
              <p className="text-sm text-muted-foreground mt-1.5">Type a product, service, or seller name above to get started.</p>
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
                {popularSearches.map((term) => (
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
                    Service: {c.name}
                  </Link>
                ))}
              </div>
            )}

            {matchedSellers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {matchedSellers.map((seller) => (
                  <Link key={seller.slug} to={`/seller/${seller.slug}`} className="text-sm font-medium px-4 py-2 rounded-full bg-white border border-border hover:bg-secondary transition-colors">
                    Seller: {seller.name}
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
                  title={`No products found for "${q}"`}
                  message="Try another keyword."
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
