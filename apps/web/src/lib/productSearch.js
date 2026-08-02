/** Client-side search relevance helpers (mirrors API token rules). */

export const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'and', 'or', 'of', 'to', 'in', 'on', 'with', 'from', 'by',
  'my', 'your', 'our', 'buy', 'sell', 'sale', 'get', 'best', 'cheap',
  'account', 'accounts', 'profile', 'profiles', 'service', 'services',
  'listing', 'listings', 'item', 'items', 'product', 'products', 'shop', 'store',
]);

export function tokenizeSearchQuery(raw) {
  const tokens = String(raw || '')
    .toLowerCase()
    .split(/[^a-z0-9+#._-]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const significant = tokens.filter((t) => !SEARCH_STOP_WORDS.has(t));
  return significant.length ? significant : tokens;
}

function productHaystack(product) {
  const tags = Array.isArray(product?.tags)
    ? product.tags.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean).join(' ')
    : '';
  return [
    product?.title,
    product?.shortDescription,
    product?.description,
    product?.cat,
    product?.category?.name,
    product?.artist,
    product?.sellerName,
    product?.assetPlatform,
    product?.slug,
    tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function scoreProductAgainstTokens(product, tokens = []) {
  if (!product || !tokens.length) return 0;
  const title = String(product.title || '').toLowerCase();
  const platform = String(product.assetPlatform || '').toLowerCase();
  const category = String(product.cat || product.category?.name || '').toLowerCase();
  const shortDescription = String(product.shortDescription || '').toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (title === token) score += 40;
    else if (title.startsWith(token)) score += 28;
    else if (title.includes(token)) score += 18;
    if (platform.includes(token)) score += 16;
    if (category.includes(token)) score += 10;
    if (shortDescription.includes(token)) score += 6;
  }
  return score;
}

/** Keep only products that contain every significant token somewhere relevant. */
export function filterProductsBySearchRelevance(products, query) {
  const tokens = tokenizeSearchQuery(query);
  if (!tokens.length) return [];
  return (products || [])
    .filter((product) => {
      const hay = productHaystack(product);
      return tokens.every((token) => hay.includes(token));
    })
    .sort((a, b) => {
      const diff = scoreProductAgainstTokens(b, tokens) - scoreProductAgainstTokens(a, tokens);
      if (diff !== 0) return diff;
      return 0;
    });
}

export function filterCategoriesBySearch(categories, query) {
  const needle = String(query || '').trim().toLowerCase();
  const tokens = tokenizeSearchQuery(query);
  if (!needle) return [];
  return (categories || []).filter((c) => {
    const name = String(c?.name || '').toLowerCase();
    const slug = String(c?.slug || '').toLowerCase();
    if (name.includes(needle) || slug.includes(needle)) return true;
    return tokens.some((token) => name.includes(token) || slug.includes(token));
  });
}
