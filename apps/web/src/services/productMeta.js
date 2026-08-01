/**
 * productMeta.js — small derived-display helpers shared by any place that
 * renders a product summary (ProductCard, QuickViewDialog, ProductDetailPage).
 *
 * Delivery time isn't a field in the product schema — ApnaStore-style listings
 * infer it from category: account/domain/website listings need a manual
 * verified handover, everything else (SaaS, source code, templates, courses,
 * ebooks, scripts, AI tools, mobile apps) unlocks the instant the order is
 * confirmed. Kept as one lookup table so every surface stays consistent
 * without adding a new field to every seed product.
 */

const MANUAL_HANDOVER_CATEGORIES = new Set([
  'Social Media Accounts',
  'Domains',
  'Websites',
]);

const MANUAL_DELIVERY_LABEL = 'Delivered within 24–48h';
const INSTANT_DELIVERY_LABEL = 'Instant Delivery';

/** Returns a short delivery-time label for a product, based on its category. */
export function getDeliveryTime(product) {
  if (!product) return INSTANT_DELIVERY_LABEL;
  if (product.deliveryType === 'manual' || product.deliveryType === 'handover') return MANUAL_DELIVERY_LABEL;
  if (product.deliveryType === 'instant' || product.deliveryType === 'automatic') return INSTANT_DELIVERY_LABEL;
  return MANUAL_HANDOVER_CATEGORIES.has(product.cat) ? MANUAL_DELIVERY_LABEL : INSTANT_DELIVERY_LABEL;
}

/** True for listings that go through a manual seller handover (vs. instant digital unlock). */
export function isManualHandover(product) {
  if (!product) return false;
  if (product.deliveryType === 'manual' || product.deliveryType === 'handover') return true;
  if (product.deliveryType === 'instant' || product.deliveryType === 'automatic') return false;
  return MANUAL_HANDOVER_CATEGORIES.has(product.cat);
}

/**
 * Returns a stock status descriptor, or null when stock tracking doesn't
 * apply to this product (unlimited stock, or no inventory data at all —
 * most digital listings are unlimited and simply show no stock row).
 *
 * Card / marketplace badge format: "3 Left", "20 Left", "Out of Stock".
 */
export function getStockStatus(product) {
  if (!product) return null;
  if (product.unlimitedStock) return null;
  const stock = product.stock;
  if (stock == null) return null;

  if (stock <= 0) return { label: 'Out of Stock', tone: 'destructive' };
  if (product.lowStockThreshold != null && stock <= product.lowStockThreshold) {
    return { label: `${stock} Left`, tone: 'warning' };
  }
  return { label: `${stock} Left`, tone: 'positive' };
}
