const KEY = 'pm_recently_viewed';
const MAX_ITEMS = 12;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

/** Records a product view, most-recent first, deduped, capped at MAX_ITEMS. */
export const trackProductView = (product) => {
  if (!product?.id) return;
  const entry = {
    id: product.id, title: product.title, img: product.img, cat: product.cat,
    price: product.price, rating: product.rating, reviewCount: product.reviewCount,
    downloads: product.downloads, artist: product.artist, badge: product.badge,
  };
  const next = [entry, ...read().filter((p) => String(p.id) !== String(product.id))].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors (private browsing / quota)
  }
  return next;
};

/** Recently viewed products, optionally excluding the current product page. */
export const getRecentlyViewed = (excludeId = null) =>
  read().filter((p) => String(p.id) !== String(excludeId));

/** Distinct categories from browsing history — used to seed the
 * "Recommended For You" mock logic without any backend. */
export const getRecentCategories = () => {
  const seen = new Set();
  read().forEach((p) => { if (p.cat) seen.add(p.cat); });
  return Array.from(seen);
};
