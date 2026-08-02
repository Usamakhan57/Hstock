import { Category } from '../models/index.js';
import { buildMarketplaceCategorySeedRows } from '../data/marketplaceCategories.js';
import { logger } from '../config/logger.js';

/**
 * Idempotently seed default marketplace services/categories.
 * Existing slugs are left untouched (no overwrite of admin edits).
 */
export async function seedMarketplaceCategories({ actorId = null } = {}) {
  const rows = buildMarketplaceCategorySeedRows();
  const slugToId = new Map();
  let created = 0;
  let skipped = 0;

  // Prefill map with anything already in the DB so parent links resolve.
  const existing = await Category.find({ deletedAt: null }).select('_id slug').lean();
  existing.forEach((doc) => slugToId.set(doc.slug, doc._id));

  for (const row of rows) {
    if (slugToId.has(row.slug)) {
      skipped += 1;
      continue;
    }

    const parentId = row.parentSlug ? slugToId.get(row.parentSlug) || null : null;
    // eslint-disable-next-line no-await-in-loop
    const doc = await Category.create({
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      parent: parentId,
      displayOrder: row.displayOrder,
      status: row.status,
      featured: row.featured,
      showInHeader: row.showInHeader,
      showOnHomepage: row.showOnHomepage,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      createdBy: actorId,
      updatedBy: actorId,
    });
    slugToId.set(row.slug, doc._id);
    created += 1;
  }

  logger.info('Marketplace categories seed complete', { created, skipped, total: rows.length });
  return { created, skipped, total: rows.length };
}

export default seedMarketplaceCategories;
