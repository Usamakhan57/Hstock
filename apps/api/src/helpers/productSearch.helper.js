/**
 * Marketplace product search helpers.
 * Uses AND token matching so generic words (e.g. "account") do not
 * return unrelated platform listings (Instagram ≠ Gmail).
 */

/** Generic marketplace words that should not drive relevance alone. */
export const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'for',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'with',
  'from',
  'by',
  'my',
  'your',
  'our',
  'buy',
  'sell',
  'sale',
  'get',
  'best',
  'cheap',
  'account',
  'accounts',
  'profile',
  'profiles',
  'service',
  'services',
  'listing',
  'listings',
  'item',
  'items',
  'product',
  'products',
  'shop',
  'store',
]);

export function escapeRegex(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tokenize a buyer search query into significant terms.
 * Falls back to all length>=2 tokens when every token is a stop word
 * (e.g. "digital assets" as a category-style query).
 */
export function tokenizeSearchQuery(raw) {
  const tokens = String(raw || '')
    .toLowerCase()
    .split(/[^a-z0-9+#._-]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const significant = tokens.filter((t) => !SEARCH_STOP_WORDS.has(t));
  return significant.length ? significant : tokens;
}

/** Build a Mongo clause: token must appear in product text OR linked taxonomy. */
export function buildTokenMatchClause(token, { categoryIds = [], tagIds = [] } = {}) {
  const re = new RegExp(escapeRegex(token), 'i');
  const or = [
    { title: re },
    { shortDescription: re },
    { description: re },
    { slug: re },
    { assetPlatform: re },
  ];
  if (categoryIds.length) or.push({ category: { $in: categoryIds } });
  if (tagIds.length) or.push({ tags: { $in: tagIds } });
  return { $or: or };
}

/** Higher score = more relevant (title / platform preferred). */
export function scoreProductAgainstTokens(product, tokens = []) {
  if (!product || !tokens.length) return 0;
  const title = String(product.title || '').toLowerCase();
  const shortDescription = String(product.shortDescription || '').toLowerCase();
  const description = String(product.description || '').toLowerCase();
  const platform = String(product.assetPlatform || '').toLowerCase();
  const slug = String(product.slug || '').toLowerCase();
  const categoryName = String(
    product.category?.name || product.cat || '',
  ).toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title === token) score += 40;
    else if (title.startsWith(token)) score += 28;
    else if (title.includes(token)) score += 18;

    if (platform === token || platform.includes(token)) score += 16;
    if (categoryName.includes(token)) score += 10;
    if (slug.includes(token)) score += 8;
    if (shortDescription.includes(token)) score += 6;
    if (description.includes(token)) score += 2;
  }
  return score;
}

export function sortProductsBySearchRelevance(products, tokens = []) {
  if (!Array.isArray(products) || !tokens.length) return products || [];
  return [...products].sort((a, b) => {
    const scoreDiff = scoreProductAgainstTokens(b, tokens) - scoreProductAgainstTokens(a, tokens);
    if (scoreDiff !== 0) return scoreDiff;
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}
