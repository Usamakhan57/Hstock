/**
 * Storefront API facade.
 * Product/category calls hit the production backend via catalogApi.
 * Newsletter remains a lightweight client stub until a backend endpoint exists.
 */
import { productsApi, categoriesApi } from './catalogApi';
import { ordersApi } from './ordersApi';
import { paymentsApi } from './paymentsApi';
import { walletApi } from './walletApi';
import { withdrawalsApi } from './withdrawalsApi';
import { escrowApi } from './escrowApi';
import { disputesApi } from './disputesApi';
import { sellerProductsApi } from './sellerProductsApi';

export {
  productsApi,
  categoriesApi,
  ordersApi,
  paymentsApi,
  walletApi,
  withdrawalsApi,
  escrowApi,
  disputesApi,
  sellerProductsApi,
};

export const newsletterApi = {
  async subscribe(email) {
    // Backend newsletter endpoint is not part of Phase 5 purchase-flow scope.
    return { ok: true, email };
  },
};

export default {
  productsApi,
  categoriesApi,
  ordersApi,
  paymentsApi,
  walletApi,
  withdrawalsApi,
  escrowApi,
  disputesApi,
  sellerProductsApi,
  newsletterApi,
};
