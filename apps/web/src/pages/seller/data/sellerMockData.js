/**
 * Seller dashboard mock data for the HStock-style product hub.
 *
 * The data is deterministic and derived from the seller catalog so the UI can
 * surface realistic orders, reviews, and analytics without depending on a real
 * backend while the product CRUD layer remains swap-friendly.
 */
const CUSTOMER_NAMES = ['Amelia R.', 'Noah P.', 'Isla M.', 'Liam K.', 'Sophia T.', 'Ethan G.', 'Ava L.', 'Mason D.', 'Grace H.', 'Oliver B.'];
const ORDER_STATUSES = ['pending', 'processing', 'completed', 'completed', 'completed', 'refunded', 'cancelled'];
const LICENSES = ['Personal', 'Commercial', 'Extended'];
const REVIEW_TEXTS = [
  'Exactly what I needed and the handover was smooth.',
  'Great quality and the listing was crystal clear.',
  'Delivered fast and the asset was ready to use immediately.',
  'Worth every dollar — I would buy again.',
  'The onboarding notes made everything feel effortless.',
  'Beautiful build quality and strong documentation.',
];

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n) => new Date(Date.now() - n * 60 * 60 * 1000);
const pick = (list, seed) => list[seed % list.length];

let cache = null;

export function getSellerMockData(products) {
  if (cache) return cache;
  const catalog = products.length > 0 ? products : [{ id: 'placeholder', title: 'Sample Listing', thumbnail: '', price: 10, category: 'Others', downloads: 0 }];

  const orders = Array.from({ length: 8 }).map((_, i) => {
    const p = pick(catalog, i);
    return {
      id: `PM-${(7000 + i * 37).toString(36).toUpperCase()}`,
      customer: pick(CUSTOMER_NAMES, i),
      product: p.title,
      productImg: p.thumbnail || p.img,
      amount: p.price,
      date: daysAgo((i + 1) * 2).toISOString(),
      status: pick(ORDER_STATUSES, i),
    };
  });

  const downloads = catalog.slice(0, 6).map((p, i) => ({
    id: `${p.id}-dl`,
    product: p.title,
    productImg: p.thumbnail || p.img,
    buyer: pick(CUSTOMER_NAMES, i + 2),
    downloadCount: ((p.downloads || 0) % 40) + 3,
    lastDownload: daysAgo((i + 1) * 3).toISOString(),
    license: pick(LICENSES, i),
  }));

  const reviews = catalog.slice(0, 6).map((p, i) => ({
    id: `${p.id}-rv`,
    product: p.title,
    productImg: p.thumbnail || p.img,
    buyer: pick(CUSTOMER_NAMES, i + 4),
    rating: [5, 4, 5, 3, 5, 4][i % 6],
    text: pick(REVIEW_TEXTS, i),
    date: daysAgo((i + 1) * 5).toISOString(),
    reply: i === 0 ? 'Thanks for the thoughtful feedback.' : '',
  }));

  const transactions = orders.filter((o) => o.status === 'completed').map((o) => ({ id: o.id, date: o.date, description: `Sale — ${o.product}`, amount: o.amount }));
  const withdrawals = [
    { id: 'WD-1001', date: daysAgo(20).toISOString(), amount: 42.5, method: 'Bitcoin', status: 'completed' },
    { id: 'WD-1002', date: daysAgo(6).toISOString(), amount: 18.0, method: 'Ethereum', status: 'processing' },
  ];

  const notifications = [
    { id: 1, type: 'order', message: `A new buyer grabbed "${catalog[0]?.title || 'your listing'}".`, date: hoursAgo(2).toISOString(), read: false },
    { id: 2, type: 'review', message: 'A buyer left a 5-star review on your store.', date: hoursAgo(26).toISOString(), read: false },
    { id: 3, type: 'payout', message: 'Your latest payout request is moving through.', date: daysAgo(5).toISOString(), read: true },
    { id: 4, type: 'system', message: `"${catalog[2]?.title || 'A listing'}" is now live for buyers.`, date: daysAgo(8).toISOString(), read: true },
  ];

  const salesChart = Array.from({ length: 7 }).map((_, i) => {
    const d = daysAgo(6 - i);
    return {
      day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sales: orders.filter((o) => new Date(o.date).toDateString() === d.toDateString() && o.status !== 'cancelled').reduce((s, o) => s + o.amount, 0),
    };
  });

  const totalCompleted = transactions.reduce((s, t) => s + t.amount, 0) || 30;
  const earningsChart = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      earnings: Math.round((totalCompleted / 6) * (0.6 + i * 0.15) * 100) / 100,
    };
  });

  const topCategories = Object.entries(catalog.reduce((acc, p) => {
    acc[p.category || p.cat || 'Other'] = (acc[p.category || p.cat || 'Other'] || 0) + 1;
    return acc;
  }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const bestSelling = [...catalog].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 5);

  cache = { orders, downloads, reviews, transactions, withdrawals, notifications, salesChart, earningsChart, topCategories, bestSelling };
  return cache;
}
