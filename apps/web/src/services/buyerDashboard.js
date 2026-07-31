// Frontend-only mock/local data layer for the Buyer Dashboard.
// Everything here is backed by localStorage so the UI feels persistent
// across a session, exactly like StoreContext does for cart/wishlist/orders.
// No backend, no network calls — this is demo data only, ready to be
// swapped for real API calls later without touching any component.
import { loadStorefrontProducts } from './productRepository';
import { getStorefrontSellers } from './sellerRepository';

export const loadLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const saveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/serialization errors in this mock layer
  }
};

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
export const defaultAddresses = [
  {
    id: 'addr-1', type: 'billing', isDefault: true, label: 'Home',
    fullName: 'Alex Rivera', line1: '221B Baker Street', city: 'Karachi', state: 'Sindh', postalCode: '74200', country: 'Pakistan', phone: '+92 300 1234567',
  },
  {
    id: 'addr-2', type: 'shipping', isDefault: false, label: 'Office',
    fullName: 'Alex Rivera', line1: 'Suite 12, Clifton Business Tower', city: 'Karachi', state: 'Sindh', postalCode: '75600', country: 'Pakistan', phone: '+92 300 7654321',
  },
];

// ---------------------------------------------------------------------------
// Saved crypto wallet addresses (frontend-only mock data for the demo)
// ---------------------------------------------------------------------------
export const defaultCryptoWallets = [
  { id: 'pm-1', network: 'Bitcoin', address: 'bc1qs7lp7qze...9saj', isDefault: true },
  { id: 'pm-2', network: 'Ethereum', address: '0xF7e4...21B5', isDefault: false },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const defaultNotifications = [
  { id: 'n-1', title: 'Your order PM-8X2K1Q was completed', body: 'Files are ready to download from your Downloads page.', read: false, date: daysAgo(0), category: 'order' },
  { id: 'n-2', title: 'New listing from SocialBoost', body: 'A seller you follow just published a new account listing.', read: false, date: daysAgo(1), category: 'following' },
  { id: 'n-3', title: 'Coupon SAVE20 expires soon', body: 'Use it before it expires to save 20% on your next order.', read: true, date: daysAgo(3), category: 'promo' },
  { id: 'n-4', title: 'Your support ticket was answered', body: 'Our team replied to "Download link not working".', read: true, date: daysAgo(5), category: 'support' },
  { id: 'n-5', title: 'Price drop on your wishlist', body: 'Aesthetic Digital Planner is now on sale.', read: true, date: daysAgo(9), category: 'wishlist' },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------
export const defaultTickets = [
  {
    id: 'TCK-1042', subject: 'Download link not working', status: 'resolved', priority: 'normal', createdAt: daysAgo(6),
    messages: [
      { from: 'buyer', text: 'The download link for my planner purchase gives a 404 error.', date: daysAgo(6) },
      { from: 'support', text: 'Sorry about that! We refreshed your download link — it should work now.', date: daysAgo(5) },
    ],
  },
  {
    id: 'TCK-1078', subject: 'Question about commercial license', status: 'open', priority: 'low', createdAt: daysAgo(1),
    messages: [
      { from: 'buyer', text: 'Does the Commercial license cover use in a client\u2019s Etsy shop?', date: daysAgo(1) },
    ],
  },
];

export const faqItems = [
  { q: 'How do I re-download a file I already purchased?', a: 'Go to Downloads in your dashboard — every past purchase stays available for unlimited re-downloads.' },
  { q: 'Can I get a refund?', a: 'Digital products are refundable within 7 days if the files are defective or not as described. Open a support ticket to start the process.' },
  { q: 'How do I change my license after purchase?', a: 'Contact support with your order number and the license tier you\u2019d like to upgrade to.' },
];

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const defaultCoupons = [
  { code: 'SAVE20', description: '20% off your next order', discount: '20%', status: 'active', expiresAt: daysFromNow(9) },
  { code: 'WELCOME10', description: '$10 off orders over $30', discount: '$10', status: 'active', expiresAt: daysFromNow(30) },
  { code: 'SUMMER15', description: '15% off SaaS & Source Code', discount: '15%', status: 'expired', expiresAt: daysAgo(20) },
  { code: 'FLASH5', description: '$5 off any order', discount: '$5', status: 'used', expiresAt: daysFromNow(15) },
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Reviews the buyer has written
// ---------------------------------------------------------------------------
export const buildDefaultReviews = () => {
  const sample = loadStorefrontProducts().slice(0, 3);
  return sample.map((p, i) => ({
    id: uid('rev'),
    productId: p.id,
    productTitle: p.title,
    productImg: p.img,
    rating: [5, 4, 5][i],
    text: [
      'Exactly what I needed for my shop mockups. Files were clean and easy to edit.',
      'Great quality, wish there were a couple more color variations but still worth it.',
      'Instant download worked perfectly and the commercial license PDF was included right away.',
    ][i],
    date: daysAgo([12, 25, 40][i]),
  }));
};

// ---------------------------------------------------------------------------
// Followed sellers (derived from the shared artists list, persisted so
// Follow/Unfollow from a seller's profile page and the Following page
// both read/write the same localStorage-backed list)
// ---------------------------------------------------------------------------
const FOLLOWING_KEY = 'pm_followed_sellers';

const sellerToFollowEntry = (a) => ({
  slug: a.slug,
  name: a.name,
  initials: a.initials,
  specialty: a.specialty,
  productsCount: loadStorefrontProducts().filter((p) => p.artist === a.name).length,
  followers: Math.round((parseFloat(a.sales) || 1) * 340),
});

export const buildDefaultFollowing = () => getStorefrontSellers().slice(0, 4).map(sellerToFollowEntry);

export const getFollowedSellers = () => {
  const stored = loadLS(FOLLOWING_KEY, null);
  if (stored) return stored;
  const seeded = buildDefaultFollowing();
  saveLS(FOLLOWING_KEY, seeded);
  return seeded;
};

export const isFollowingSeller = (slug) => getFollowedSellers().some((s) => s.slug === slug);

/** Toggles follow state for a seller (by slug/name pair from data.js's
 * artists list) and returns the updated list. */
export const toggleFollowSeller = (artist) => {
  const current = getFollowedSellers();
  const next = current.some((s) => s.slug === artist.slug)
    ? current.filter((s) => s.slug !== artist.slug)
    : [...current, sellerToFollowEntry(artist)];
  saveLS(FOLLOWING_KEY, next);
  return next;
};

export const unfollowSeller = (slug) => {
  const next = getFollowedSellers().filter((s) => s.slug !== slug);
  saveLS(FOLLOWING_KEY, next);
  return next;
};

// ---------------------------------------------------------------------------
// Browsing history (mock — a fixed recently-viewed / recently-downloaded set)
// ---------------------------------------------------------------------------
export const buildRecentlyViewed = () => loadStorefrontProducts().slice(3, 9);
export const buildRecommended = () => loadStorefrontProducts().slice(5, 11);
