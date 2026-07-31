import hstockLogo from './assets/hstock-logo.png';

export const LOGO = hstockLogo;

// Turns a category name into a URL-safe slug, e.g. "T-Shirt Design" -> "t-shirt-design"
export const slugify = (name) =>
  name.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// NOTE: categories used to be hardcoded here, completely disconnected
// from the Admin Category CMS — a category created in Admin never showed
// up anywhere on the storefront. Categories now live entirely in
// services/categoryRepository.js (backed by the Admin Category CMS via
// pm_admin_categories), which is the only place any page/component
// should read categories from.
//
// The same used to be true of products, sellers/artists, collections,
// blog posts, FAQs, and testimonials — each had its own hardcoded array
// here, disconnected from its Admin CMS. Those have all been closed the
// same way: products -> services/productRepository.js, sellers/artists ->
// services/sellerRepository.js, collections -> services/collectionRepository.js,
// blog posts -> services/blog/blogService.js, FAQs -> services/faqRepository.js,
// testimonials -> services/testimonialRepository.js. Nothing product-,
// seller-, collection-, blog-, FAQ-, or testimonial-related should be
// hardcoded here again — add it to the relevant Admin seed data instead.

// Shared license tiers — most products offer both; a few (bundles, fonts)
// are Commercial-only or Personal-only, set per-product via `licenseIds`.
export const licenseCatalog = {
  personal: {
    id: 'personal',
    name: 'Personal Use',
    priceMultiplier: 1,
    description: 'For personal projects, gifts, and non-commercial use only. Not for resale or client work.',
    permissions: ['Use in personal projects', 'Print for personal/gift use', 'Unlimited personal downloads'],
    restrictions: ['No resale or redistribution', 'No use in client or commercial work', 'No claiming as your own design'],
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial Use',
    priceMultiplier: 1.8,
    description: 'For small business use, client work, and products for resale — up to 500 end-product sales.',
    permissions: ['Everything in Personal', 'Use in client and commercial projects', 'Sell up to 500 physical/digital end products', 'Use in branding and marketing'],
    restrictions: ['No reselling the raw files themselves', 'No claiming original design credit'],
  },
  extended: {
    id: 'extended',
    name: 'Extended Commercial',
    priceMultiplier: 3,
    description: 'Unlimited commercial end-product sales, for agencies and high-volume sellers.',
    permissions: ['Everything in Commercial', 'Unlimited end-product sales', 'Use across multiple brands/clients'],
    restrictions: ['No reselling the raw files themselves'],
  },
};

/** Sample reviews shown on the product detail page — same shape a real
 *  review submission would produce, so wiring a review form to this
 *  array later is a drop-in change. */
export const sampleReviews = [
  { name: 'Jordan K.', rating: 5, date: '2025-06-02', text: 'Exactly what I needed for my shop mockups. Files were clean and easy to edit.' },
  { name: 'Sam R.', rating: 4, date: '2025-05-18', text: 'Great quality, wish there were a couple more color variations but still worth it.' },
  { name: 'Taylor M.', rating: 5, date: '2025-04-30', text: 'Instant download worked perfectly and the commercial license PDF was included right away.' },
];
