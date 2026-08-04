/**
 * faqRepository — storefront FAQs from Mongo CMS (`/api/v1/cms`).
 */
import { cmsApi, CMS_KEYS } from './cmsApi';

export async function fetchStorefrontFaqCategories() {
  const [categoriesDoc, faqsDoc] = await Promise.all([
    cmsApi.get(CMS_KEYS.FAQ_CATEGORIES, { force: false }),
    cmsApi.get(CMS_KEYS.FAQS, { force: false }),
  ]);

  const categories = Array.isArray(categoriesDoc?.items) ? categoriesDoc.items : [];
  const faqs = Array.isArray(faqsDoc?.items) ? faqsDoc.items : [];

  return [...categories]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((cat) => ({
      title: cat.name,
      items: faqs
        .filter((f) => f.categoryId === cat.id && f.status === 'published')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((f) => ({ q: f.question, a: f.answer })),
    }))
    .filter((cat) => cat.items.length > 0);
}

/** @deprecated Prefer fetchStorefrontFaqCategories / useCms */
export function getStorefrontFaqCategories() {
  return [];
}

export default {
  fetchStorefrontFaqCategories,
  getStorefrontFaqCategories,
};
