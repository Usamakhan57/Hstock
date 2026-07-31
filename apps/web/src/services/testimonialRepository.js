/**
 * testimonialRepository.js — Single source of truth for storefront
 * testimonials (customer quotes shown on the homepage and About page).
 *
 * Reads from `pm_admin_testimonials` (written by the Admin Testimonials
 * CMS) and maps the admin schema to the storefront shape those pages need.
 * Mirrors categoryRepository.js / productRepository.js / sellerRepository.js
 * / collectionRepository.js / faqRepository.js — closing the same gap
 * (HomePage/AboutPage previously read a hardcoded `testimonials` array
 * from data.js, disconnected from the Testimonials CMS).
 *
 * The admin schema has no "role" field (e.g. "Etsy Shop Owner") yet, so
 * every mapped testimonial gets a generic "Verified Buyer" label rather
 * than inventing per-customer job titles that were never actually entered.
 */
import { seedTestimonials } from '../admin/api/seedData';

const STORAGE_KEY = 'pm_admin_testimonials';

function loadRawTestimonials() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // corrupted — fall through to seed
  }
  return seedTestimonials;
}

function initialsFor(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

function mapToStorefront(t) {
  return {
    id: t.id,
    name: t.customerName,
    role: 'Verified Buyer',
    text: t.review,
    initials: initialsFor(t.customerName),
    rating: t.rating ?? 5,
  };
}

/** Published testimonials, mapped for storefront use. */
export function getStorefrontTestimonials() {
  return loadRawTestimonials()
    .filter((t) => t.status === 'published')
    .map(mapToStorefront);
}
