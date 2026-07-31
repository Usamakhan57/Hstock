/**
 * Storefront product repository helpers.
 * Primary data comes from backend via catalogCache / productsApi.
 */
import {
  getCachedProducts,
  hydrateCatalog,
} from './catalogCache';

export async function hydrateProducts({ force = false } = {}) {
  await hydrateCatalog({ force });
  return getCachedProducts();
}

export function loadStorefrontProducts() {
  return getCachedProducts();
}

export function findProductById(idOrSlug) {
  const key = String(idOrSlug);
  return getCachedProducts().find((p) => String(p.id) === key || p.slug === key) || null;
}

export function getProductCountByCategoryId(categoryId) {
  const products = getCachedProducts();
  if (categoryId == null || categoryId === '') {
    return products.reduce((acc, product) => {
      const id = product.categoryId;
      if (id == null) return acc;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
  }
  return products.filter((product) => String(product.categoryId) === String(categoryId)).length;
}

export default {
  loadStorefrontProducts,
  findProductById,
  getProductCountByCategoryId,
  hydrateProducts,
};
