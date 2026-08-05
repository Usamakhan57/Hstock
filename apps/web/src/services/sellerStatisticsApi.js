import { get } from '../lib/apiClient';
import { clearRequestCache, cacheKey, cachedRequest } from '../lib/requestCache';

const STATS_NAMESPACE = 'seller-statistics';

function mapStats(data = {}) {
  return {
    totalSales: Number(data.totalSales || 0),
    ordersCount: Number(data.ordersCount || 0),
    productsSold: Number(data.productsSold || 0),
    completedOrders: Number(data.completedOrders || 0),
  };
}

/**
 * Shared seller Total Sales — same aggregation as public profile / featured stores.
 */
export const sellerStatisticsApi = {
  me({ force = false } = {}) {
    const key = cacheKey(STATS_NAMESPACE, { scope: 'me' });
    if (force) clearRequestCache(STATS_NAMESPACE);
    return cachedRequest(key, () => (
      get('/sellers/me/statistics').then(({ data }) => mapStats(data))
    ));
  },

  invalidate() {
    clearRequestCache(STATS_NAMESPACE);
  },
};

export default sellerStatisticsApi;
