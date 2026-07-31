/**
 * Storefront API facade.
 * Product/category calls hit the production backend via catalogApi.
 * Newsletter remains a lightweight client stub until a backend endpoint exists.
 */
import { productsApi, categoriesApi, collectionsApi } from './catalogApi';

export { productsApi, categoriesApi, collectionsApi };

export const newsletterApi = {
  async subscribe(email) {
    // Backend newsletter endpoint is not part of Phase 4.1 scope.
    return { ok: true, email };
  },
};

export default {
  productsApi,
  categoriesApi,
  collectionsApi,
  newsletterApi,
};
