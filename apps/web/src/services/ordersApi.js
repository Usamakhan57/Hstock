import { get, post } from '../lib/apiClient';
import { mapBackendOrder } from '../lib/mappers/commerceMappers';
import { cacheKey, cachedRequest, clearRequestCache } from '../lib/requestCache';

function originUrls(orderRef) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const success = `${origin}/order-success${orderRef ? `?order=${encodeURIComponent(orderRef)}` : ''}`;
  const failed = `${origin}/order-failed`;
  return { urlSuccess: success, urlReturn: failed };
}

export const ordersApi = {
  async buyNow({
    productId,
    quantity = 1,
    paymentMethod = 'cryptomus',
    toCurrency = 'USDT',
    network = 'tron',
    idempotencyKey,
  }) {
    const urls = originUrls();
    const { data } = await post('/orders/buy-now', {
      productId,
      quantity,
      paymentMethod,
      toCurrency: paymentMethod === 'wallet' ? undefined : toCurrency,
      network: paymentMethod === 'wallet' ? undefined : network,
      urlSuccess: urls.urlSuccess,
      urlReturn: urls.urlReturn,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });

    // Persist order refs so /order-success can resolve after Cryptomus redirect.
    const orderNumber = data?.order?.orderNumber || data?.order?._id;
    if (orderNumber && typeof window !== 'undefined') {
      sessionStorage.setItem('hs_pending_order', orderNumber);
      if (data?.order?._id) sessionStorage.setItem('hs_pending_order_id', data.order._id);
    }

    clearRequestCache('orders');
    clearRequestCache('payments');
    return {
      order: mapBackendOrder(data.order),
      payment: data.payment,
      escrow: data.escrow,
      paymentUrl: data.paymentUrl,
      paymentMethod: data.paymentMethod || paymentMethod,
      wallet: data.wallet || null,
      cryptomus: data.cryptomus,
      raw: data,
    };
  },

  async list({ page = 1, limit = 20, status, scope } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (scope) params.scope = scope;
    const key = cacheKey('orders', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/orders', { params });
      const items = Array.isArray(data) ? data.map(mapBackendOrder) : [];
      return { items, meta };
    }, 10_000);
  },

  async get(idOrNumber) {
    const key = cacheKey('order', { idOrNumber });
    return cachedRequest(key, async () => {
      const { data } = await get(`/orders/${idOrNumber}`);
      return mapBackendOrder(data);
    }, 5_000);
  },

  async cancel(idOrNumber, reason) {
    const { data } = await post(`/orders/${idOrNumber}/cancel`, reason ? { reason } : {});
    clearRequestCache('orders');
    return mapBackendOrder(data);
  },

  async deliver(idOrNumber) {
    const { data } = await post(`/orders/${idOrNumber}/deliver`, {});
    clearRequestCache('orders');
    return mapBackendOrder(data);
  },

  async getDelivery(idOrNumber) {
    const key = cacheKey('order-delivery', { idOrNumber });
    return cachedRequest(key, async () => {
      const { data } = await get(`/orders/${idOrNumber}/delivery`);
      return data;
    }, 5_000);
  },
};

export default ordersApi;
