/**
 * Pure category-tree helpers. These take an already-fetched flat category
 * array and return derived structures — no I/O, no storage access. Both
 * the Admin Category CMS (admin/pages/categories) and the frontend
 * categoryRepository import these so tree-walking logic exists in exactly
 * one place, with unlimited nesting depth (no hardcoded levels anywhere).
 *
 * A category is "alive" if it has no `deletedAt`. Callers are expected to
 * pass in whichever slice (all, active-only, non-trashed) makes sense for
 * their use — these helpers don't filter by status themselves except
 * where noted.
 */

/** Direct children of a category (or root-level categories when parentId is null/undefined). */
export function getChildren(categories, parentId = null) {
  return categories
    .filter((c) => (c.parentId || null) === (parentId || null))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

/** Top-level categories (no parent). */
export function getRootCategories(categories) {
  return getChildren(categories, null);
}

/** Build a nested tree from a flat list. Each node gets a `children` array, recursively, to unlimited depth. */
export function getCategoryTree(categories, parentId = null) {
  return getChildren(categories, parentId).map((cat) => ({
    ...cat,
    children: getCategoryTree(categories, cat.id),
  }));
}

/** Flatten a tree (from getCategoryTree) back into a depth-first list, each node annotated with `depth` (0 = root). Useful for indented dropdowns/lists. */
export function flattenCategories(tree, depth = 0) {
  return tree.flatMap((node) => {
    const { children = [], ...rest } = node;
    return [{ ...rest, depth }, ...flattenCategories(children, depth + 1)];
  });
}

/** Ancestor chain from root down to (but not including) the category itself — e.g. for breadcrumbs. */
export function getAncestors(categories, categoryId) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain = [];
  let current = byId.get(categoryId);
  while (current?.parentId && byId.has(current.parentId)) {
    current = byId.get(current.parentId);
    chain.unshift(current);
  }
  return chain;
}

/** All nested descendants of a category, flat, any depth. */
export function getDescendants(categories, categoryId) {
  const direct = getChildren(categories, categoryId);
  return direct.flatMap((c) => [c, ...getDescendants(categories, c.id)]);
}

/** True if `maybeAncestorId` is the same as, or an ancestor of, `categoryId` — used to stop a category being re-parented under its own descendant. */
export function isSelfOrDescendant(categories, categoryId, maybeDescendantId) {
  if (categoryId === maybeDescendantId) return true;
  return getDescendants(categories, categoryId).some((c) => c.id === maybeDescendantId);
}

/** Sum a node's own count (from a { [id]: count } map) plus every descendant's, recursively — e.g. rolling product counts up from leaf categories to their parents. */
export function getRolledUpCount(node, countsById) {
  const own = countsById[node.id] || 0;
  const childrenSum = (node.children || []).reduce((sum, child) => sum + getRolledUpCount(child, countsById), 0);
  return own + childrenSum;
}
