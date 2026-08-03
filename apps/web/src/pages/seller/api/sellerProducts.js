/**
 * Seller product CRUD — production backend via sellerProductsApi.
 * Keeps the same function names used by seller UI tabs/editor.
 */
import { sellerProductsApi } from '../../../services/sellerProductsApi';

export async function getSellerProducts() {
  const { items } = await sellerProductsApi.list({ page: 1, limit: 100 });
  return items;
}

export async function getSellerProduct(id) {
  return sellerProductsApi.get(id);
}

export async function createSellerProduct(payload, options = {}) {
  const { inventoryAccounts, ...form } = payload || {};
  return sellerProductsApi.create(form, {
    ...options,
    inventoryAccounts: inventoryAccounts || options.inventoryAccounts || [],
  });
}

export async function updateSellerProduct(id, payload, options = {}) {
  const { inventoryAccounts, ...form } = payload || {};
  return sellerProductsApi.update(id, form, {
    ...options,
    inventoryAccounts: inventoryAccounts ?? options.inventoryAccounts ?? null,
  });
}

export async function replaceSellerInventory(id, accounts, options = {}) {
  return sellerProductsApi.replaceInventory(id, accounts, options);
}

export async function getSellerInventory(id, options = {}) {
  return sellerProductsApi.listInventory(id, options);
}

export async function deleteSellerProduct(id) {
  return sellerProductsApi.remove(id);
}

export async function submitSellerProduct(id) {
  return sellerProductsApi.submit(id);
}
