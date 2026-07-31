import React, { useMemo, useState } from 'react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { buildRecentlyViewed } from '../../services/buyerDashboard';
import { useStore } from '../../context/StoreContext';

const TABS = ['Recently Viewed', 'Recently Downloaded'];

const BrowsingHistoryPage = () => {
  const { orders } = useStore();
  const [tab, setTab] = useState(TABS[0]);
  const recentlyViewed = useMemo(() => buildRecentlyViewed(), []);
  const recentlyDownloaded = useMemo(
    () => {
      const seen = new Set();
      return orders.map((o) => o.product).filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
    },
    [orders]
  );

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

        {list.length === 0 ? (
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
