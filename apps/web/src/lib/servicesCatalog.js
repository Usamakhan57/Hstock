/**
 * Pure helpers for the premium Services / Categories page.
 * Groups a storefront category tree into ordered sections with live counts.
 */

/** Preferred section order + friendly headings (matched by slug or name). */
export const SERVICE_SECTION_ORDER = Object.freeze([
  { key: 'social', heading: 'Social Media', match: [/social/] },
  { key: 'gaming', heading: 'Gaming', match: [/gam(e|ing)/] },
  { key: 'streaming', heading: 'Streaming', match: [/stream/] },
  { key: 'hosting', heading: 'Hosting', match: [/host/] },
  { key: 'email', heading: 'Email', match: [/email/, /\bmail\b/] },
  { key: 'software', heading: 'Software', match: [/software/, /\bsaas\b/] },
  { key: 'ai', heading: 'AI Tools', match: [/\bai\b/, /artificial/] },
  { key: 'crypto', heading: 'Crypto', match: [/crypto/, /\bcoin/, /wallet/] },
  { key: 'domains', heading: 'Domains', match: [/domain/] },
  { key: 'gift-cards', heading: 'Gift Cards', match: [/gift/] },
  { key: 'licenses', heading: 'Digital Licenses', match: [/licen[cs]e/] },
  { key: 'courses', heading: 'Courses', match: [/course/, /tutor/] },
  { key: 'ebooks', heading: 'E-books', match: [/e-?books?/] },
  { key: 'vpn', heading: 'VPN', match: [/\bvpn\b/, /proxy/] },
  { key: 'other', heading: 'Other Services', match: [/other/, /misc/, /digital assets/, /source code/] },
]);

/** Normalize a category label for compact card titles (Instagram Accounts → Instagram). */
export function displayServiceName(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  return raw
    .replace(/\s+Accounts$/i, '')
    .replace(/\s+Account$/i, '')
    .replace(/\s+Assets$/i, '')
    .trim() || raw;
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matchServiceSection(category) {
  const haystack = `${normalizeKey(category?.slug)} ${normalizeKey(category?.name)}`;
  for (let index = 0; index < SERVICE_SECTION_ORDER.length; index += 1) {
    const section = SERVICE_SECTION_ORDER[index];
    if (section.match.some((re) => re.test(haystack))) {
      return { ...section, order: index };
    }
  }
  return null;
}

/**
 * Build ordered service sections from a category tree.
 * Roots with children become section headings; children become cards.
 * Leaf roots become a single-card section under their matched/own heading.
 */
export function buildServiceSections(tree = [], countsById = {}) {
  const roots = Array.isArray(tree) ? tree : [];
  const used = new Set();
  const sections = [];

  const pushSection = (heading, items, order) => {
    const cards = items
      .filter(Boolean)
      .map((cat) => {
        const count = typeof cat.count === 'number'
          ? cat.count
          : (countsById[cat.id] || countsById[String(cat.id)] || cat.productCount || 0);
        return {
          id: cat.id || cat._id,
          slug: cat.slug,
          name: cat.name,
          displayName: displayServiceName(cat.name),
          image: cat.image || null,
          icon: cat.icon,
          color: cat.color,
          count: Number(count) || 0,
        };
      })
      .filter((card) => card.id && card.slug);

    if (!cards.length) return;
    sections.push({
      key: `${order}-${normalizeKey(heading) || 'section'}`,
      heading,
      order,
      cards,
      totalProducts: cards.reduce((sum, card) => sum + card.count, 0),
    });
  };

  // Preferred sections first (match roots by name/slug).
  SERVICE_SECTION_ORDER.forEach((spec, order) => {
    const matchedRoots = roots.filter((root) => {
      if (used.has(root.id)) return false;
      const hit = matchServiceSection(root);
      return hit?.key === spec.key;
    });

    if (!matchedRoots.length) return;

    matchedRoots.forEach((root) => used.add(root.id));

    const childCards = matchedRoots.flatMap((root) => {
      const children = Array.isArray(root.children) ? root.children : [];
      if (!children.length) {
        return [{ ...root, count: countsById[root.id] || root.productCount || 0 }];
      }
      return children.map((child) => ({
        ...child,
        count: countsById[child.id] || child.productCount || 0,
      }));
    });

    pushSection(spec.heading, childCards, order);
  });

  // Remaining unmatched roots keep their DB name and append after preferred order.
  roots.forEach((root, index) => {
    if (used.has(root.id)) return;
    used.add(root.id);
    const children = Array.isArray(root.children) ? root.children : [];
    const cards = children.length
      ? children.map((child) => ({
        ...child,
        count: countsById[child.id] || child.productCount || 0,
      }))
      : [{ ...root, count: countsById[root.id] || root.productCount || 0 }];
    pushSection(root.name || 'Services', cards, SERVICE_SECTION_ORDER.length + index);
  });

  return sections.sort((a, b) => a.order - b.order);
}

export default {
  SERVICE_SECTION_ORDER,
  displayServiceName,
  matchServiceSection,
  buildServiceSections,
};
