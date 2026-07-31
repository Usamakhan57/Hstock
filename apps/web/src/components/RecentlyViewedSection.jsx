import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { getRecentlyViewed } from '../services/recentlyViewed';

/**
 * Renders nothing if there's no browsing history yet — safe to drop
 * into any page unconditionally. `excludeId` keeps a product detail
 * page from showing itself in its own "recently viewed" row.
 */
const RecentlyViewedSection = ({ excludeId = null, title = 'Recently Viewed', limit = 6, className = 'mt-20' }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed(excludeId).slice(0, limit));
  }, [excludeId, limit]);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-5">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
};

export default RecentlyViewedSection;
