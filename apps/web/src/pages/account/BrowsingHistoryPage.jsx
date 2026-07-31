import React, { useMemo, useState } from 'react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductGridSkeleton } from '../../components/Skeletons';
import { buildRecentlyViewed } from '../../services/buyerDashboard';
import { useFetch } from '../../hooks/useFetch';
import { ordersApi } from '../../services/ordersApi';

const TABS = ['Recently Viewed', 'Recently Downloaded'];

const BrowsingHistoryPage = () => {
  const [tab, setTab] = useState(TABS[0]);
  const recentlyViewed = useMemo(() => buildRecentlyViewed(), []);
  const { data, loading, error, retry } = useFetch(
    () => ordersApi.list({ page: 1, limit: 50, scope: 'buyer' }),
    [],
  );

  const recentlyDownloaded = useMemo(() => {
    const seen = new Set();
    return (data?.items || [])
      .map((o) => o.product)
      .filter((i) => i?.id && (seen.has(i.id) ? false : (seen.add(i.id), true)));
  }, [data]);

  const list = tab === TABS[0] ? recentlyViewed : recentlyDownloaded;

  return (
    <>
      <Seo title="Browsing History" description="Products you've recently viewed and downloaded on HStock." noIndex />
      <AccountLayout title="Browsing History" subtitle="Products you've recently viewed and downloaded.">
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${tab === t ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}>{t}</button>
          ))}
        </div>

        {tab === TABS[1] && loading ? (
          <ProductGridSkeleton count={8} />
        ) : tab === TABS[1] && error ? (
          <NetworkErrorState onRetry={retry} message={error.message} />
        ) : list.length === 0 ? (
          <EmptyState title="Nothing here yet" message={tab === TABS[0] ? 'Products you view will show up here.' : 'Products you download will show up here.'} actionLabel="Browse the Shop" actionTo="/shop" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </AccountLayout>
    </>
  );
};

export default BrowsingHistoryPage;
