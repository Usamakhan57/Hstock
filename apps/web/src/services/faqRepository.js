/**
 * faqRepository.js — Single source of truth for storefront FAQs.
 *
 * Reads from `pm_admin_faq_categories` and `pm_admin_faqs` (written by the
 * Admin FAQ CMS) and joins them into the grouped shape FAQPage needs.
 * Mirrors categoryRepository.js / productRepository.js / sellerRepository.js
 * — closing the same gap (FAQPage previously read
 * a hardcoded `faqCategories` array from data.js, disconnected from the
 * FAQ CMS built in the Admin panel).
 */
import { seedFaqCategories, seedFaqs } from '../admin/api/seedData';

const CATEGORIES_KEY = 'pm_admin_faq_categories';
const FAQS_KEY = 'pm_admin_faqs';

function loadRaw(key, seed) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // corrupted — fall through to seed
  }
  return seed;
}

/**
 * Published FAQs grouped by category, in category then FAQ sort order.
 * Categories with no published FAQs are omitted so the page never shows
 * an empty section.
 */
export function getStorefrontFaqCategories() {
  const categories = loadRaw(CATEGORIES_KEY, seedFaqCategories);
  const faqs = loadRaw(FAQS_KEY, seedFaqs);

  const sortedCategories = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return sortedCategories
    .map((cat) => ({
      title: cat.name,
      items: faqs
        .filter((f) => f.categoryId === cat.id && f.status === 'published')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((f) => ({ q: f.question, a: f.answer })),
    }))
    .filter((cat) => cat.items.length > 0);
}
