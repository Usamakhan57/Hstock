/**
 * Default marketplace services (categories) for ApnaStore.
 * Seed is idempotent — matches existing rows by slug and skips duplicates.
 */

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** @typedef {{ name: string, icon?: string, children?: string[] }} ServiceGroup */

/** Flat + nested digital marketplace services. */
export const MARKETPLACE_SERVICE_GROUPS = [
  {
    name: 'Social Accounts',
    icon: 'Users',
    children: [
      'Instagram Accounts',
      'Facebook Accounts',
      'TikTok Accounts',
      'Twitter (X) Accounts',
      'YouTube Accounts',
      'Telegram Accounts',
      'Discord Accounts',
      'LinkedIn Accounts',
      'Reddit Accounts',
      'Pinterest Accounts',
      'Snapchat Accounts',
    ],
  },
  {
    name: 'Email Accounts',
    icon: 'Mail',
    children: [
      'Gmail Accounts',
      'Yahoo Accounts',
      'Outlook Accounts',
      'Hotmail Accounts',
      'AOL Accounts',
      'ProtonMail Accounts',
    ],
  },
  {
    name: 'Streaming',
    icon: 'Youtube',
    children: ['Netflix', 'Spotify', 'Disney+', 'Prime Video', 'Crunchyroll'],
  },
  {
    name: 'Gaming',
    icon: 'Trophy',
    children: ['Steam', 'Epic Games', 'PlayStation', 'Xbox', 'EA', 'Battle.net', 'Riot Games'],
  },
  {
    name: 'Software',
    icon: 'Cloud',
    children: ['Canva', 'ChatGPT', 'Midjourney', 'Envato', 'Adobe', 'Microsoft 365', 'CapCut', 'Grammarly'],
  },
  {
    name: 'Domains',
    icon: 'Globe2',
    children: ['Expired Domains', 'Premium Domains'],
  },
  {
    name: 'Hosting',
    icon: 'Server',
    children: ['Shared Hosting', 'VPS', 'RDP', 'cPanel', 'WHM'],
  },
  {
    name: 'Source Code',
    icon: 'FileCode2',
    children: ['Scripts', 'Websites', 'Mobile Apps', 'Themes', 'Plugins'],
  },
  { name: 'Gift Cards', icon: 'Sparkles' },
  { name: 'Crypto', icon: 'Coins' },
  { name: 'VPN', icon: 'Shield' },
  { name: 'Proxy', icon: 'Globe' },
  { name: 'Digital Licenses', icon: 'BadgeCheck' },
  { name: 'SaaS', icon: 'Cloud' },
  { name: 'E-books', icon: 'BookOpen' },
  { name: 'Courses', icon: 'GraduationCap' },
  { name: 'AI Tools', icon: 'Bot' },
  { name: 'Other Digital Assets', icon: 'Layers' },
];

const CHILD_ICONS = {
  'instagram-accounts': 'Instagram',
  'facebook-accounts': 'Facebook',
  'tiktok-accounts': 'Music2',
  'twitter-x-accounts': 'Twitter',
  'youtube-accounts': 'Youtube',
  'telegram-accounts': 'Send',
  'discord-accounts': 'MessageCircle',
  'linkedin-accounts': 'Briefcase',
  'reddit-accounts': 'MessageSquare',
  'pinterest-accounts': 'Image',
  'snapchat-accounts': 'Camera',
  'gmail-accounts': 'Mail',
  'yahoo-accounts': 'Mail',
  'outlook-accounts': 'Mail',
  'hotmail-accounts': 'Mail',
  'aol-accounts': 'Mail',
  'protonmail-accounts': 'Mail',
  netflix: 'Youtube',
  spotify: 'Music2',
  'disney-plus': 'Youtube',
  'prime-video': 'Youtube',
  crunchyroll: 'Youtube',
  steam: 'Trophy',
  'epic-games': 'Trophy',
  playstation: 'Trophy',
  xbox: 'Trophy',
  ea: 'Trophy',
  'battle-net': 'Trophy',
  'riot-games': 'Trophy',
  canva: 'Palette',
  chatgpt: 'Bot',
  midjourney: 'Bot',
  envato: 'Layers',
  adobe: 'Palette',
  'microsoft-365': 'Cloud',
  capcut: 'Film',
  grammarly: 'NotebookPen',
  'expired-domains': 'Globe2',
  'premium-domains': 'Globe2',
  'shared-hosting': 'Server',
  vps: 'Server',
  rdp: 'Monitor',
  cpanel: 'Server',
  whm: 'Server',
  scripts: 'Terminal',
  websites: 'Globe',
  'mobile-apps': 'Smartphone',
  themes: 'LayoutTemplate',
  plugins: 'Puzzle',
};

function childSlug(name) {
  return slugify(name.replace(/\+/g, ' plus ').replace(/\(x\)/gi, 'x'));
}

/**
 * Expand groups into create payloads (parents first, then children).
 * displayOrder is alphabetical within each level for stable UI.
 */
export function buildMarketplaceCategorySeedRows() {
  const roots = [...MARKETPLACE_SERVICE_GROUPS].sort((a, b) => a.name.localeCompare(b.name));
  const rows = [];

  roots.forEach((group, rootIndex) => {
    const parentSlug = slugify(group.name);
    rows.push({
      name: group.name,
      slug: parentSlug,
      description: `${group.name} available on ApnaStore digital marketplace.`,
      icon: group.icon || 'Sparkles',
      parentSlug: null,
      displayOrder: rootIndex,
      status: 'active',
      featured: rootIndex < 8,
      showInHeader: true,
      showOnHomepage: true,
      seoTitle: `${group.name} | ApnaStore`,
      seoDescription: `Browse ${group.name.toLowerCase()} from verified sellers on ApnaStore.`,
    });

    const children = [...(group.children || [])].sort((a, b) => a.localeCompare(b));
    children.forEach((childName, childIndex) => {
      const slug = childSlug(childName);
      rows.push({
        name: childName,
        slug,
        description: `${childName} listings from verified ApnaStore sellers.`,
        icon: CHILD_ICONS[slug] || group.icon || 'Sparkles',
        parentSlug,
        displayOrder: childIndex,
        status: 'active',
        featured: false,
        showInHeader: true,
        showOnHomepage: true,
        seoTitle: `${childName} | ApnaStore`,
        seoDescription: `Buy and sell ${childName.toLowerCase()} securely on ApnaStore.`,
      });
    });
  });

  return rows;
}

export { slugify as slugifyCategoryName };
