/**
 * Default marketplace services (categories) for ApnaStore.
 * Seed is idempotent — matches existing rows by slug and skips duplicates.
 *
 * Parent display order follows the premium Services page section order.
 */

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** @typedef {{ name: string, icon?: string, children?: string[] }} ServiceGroup */

/** Nested digital marketplace services — order = Services page sections. */
export const MARKETPLACE_SERVICE_GROUPS = [
  {
    name: 'Social Accounts',
    icon: 'Users',
    children: [
      'Instagram Accounts',
      'Facebook Accounts',
      'TikTok Accounts',
      'Threads Accounts',
      'Telegram Accounts',
      'YouTube Accounts',
      'Snapchat Accounts',
      'Reddit Accounts',
      'Pinterest Accounts',
      'LinkedIn Accounts',
      'Twitter (X) Accounts',
      'Discord Accounts',
      'WhatsApp Accounts',
      'WeChat Accounts',
      'Kakao Accounts',
      'Line Accounts',
      'VK Accounts',
      'Naver Accounts',
      'Band Accounts',
    ],
  },
  {
    name: 'Gaming',
    icon: 'Trophy',
    children: [
      'PUBG',
      'Free Fire',
      'Steam',
      'Battle.net',
      'Epic Games',
      'Riot Games',
      'Roblox',
      'EA',
      'PlayStation',
      'Xbox',
      'Mobile Legends',
      'Valorant',
      'Minecraft',
    ],
  },
  {
    name: 'Streaming',
    icon: 'Youtube',
    children: ['Netflix', 'Spotify', 'Disney+', 'Prime Video', 'Crunchyroll', 'Hulu'],
  },
  {
    name: 'Hosting',
    icon: 'Server',
    children: ['cPanel', 'WHM', 'VPS', 'Shared Hosting', 'RDP'],
  },
  {
    name: 'Email Accounts',
    icon: 'Mail',
    children: [
      'Gmail Accounts',
      'Yahoo Accounts',
      'Outlook Accounts',
      'ProtonMail Accounts',
      'Zoho Accounts',
      'Business Email',
      'Hotmail Accounts',
      'Other Emails',
    ],
  },
  {
    name: 'Software',
    icon: 'Cloud',
    children: [
      'Windows',
      'Office',
      'Adobe',
      'Canva',
      'Grammarly',
      'JetBrains',
      'Microsoft 365',
      'CapCut',
      'Envato',
    ],
  },
  {
    name: 'AI Tools',
    icon: 'Bot',
    children: [
      'ChatGPT',
      'Claude',
      'Gemini',
      'Midjourney',
      'Cursor',
      'ElevenLabs',
      'Perplexity',
    ],
  },
  {
    name: 'Crypto',
    icon: 'Coins',
    children: ['Binance', 'Bybit', 'Coinbase', 'OKX', 'KuCoin', 'Wallets'],
  },
  {
    name: 'Domains',
    icon: 'Globe2',
    children: ['Expired Domains', 'Premium Domains'],
  },
  { name: 'Gift Cards', icon: 'Sparkles' },
  { name: 'Digital Licenses', icon: 'BadgeCheck' },
  { name: 'Courses', icon: 'GraduationCap' },
  { name: 'E-books', icon: 'BookOpen' },
  { name: 'VPN', icon: 'Shield' },
  {
    name: 'Other Digital Assets',
    icon: 'Layers',
    children: ['Scripts', 'Websites', 'Mobile Apps', 'Themes', 'Plugins', 'SaaS', 'Proxy'],
  },
];

const CHILD_ICONS = {
  'instagram-accounts': 'Instagram',
  'facebook-accounts': 'Facebook',
  'tiktok-accounts': 'Music2',
  'threads-accounts': 'MessageCircle',
  'twitter-x-accounts': 'Twitter',
  'youtube-accounts': 'Youtube',
  'telegram-accounts': 'Send',
  'discord-accounts': 'MessageCircle',
  'linkedin-accounts': 'Briefcase',
  'reddit-accounts': 'MessageSquare',
  'pinterest-accounts': 'Image',
  'snapchat-accounts': 'Camera',
  'whatsapp-accounts': 'MessageCircle',
  'wechat-accounts': 'MessageCircle',
  'kakao-accounts': 'MessageCircle',
  'line-accounts': 'MessageCircle',
  'vk-accounts': 'Users',
  'naver-accounts': 'Globe',
  'band-accounts': 'Users',
  'gmail-accounts': 'Mail',
  'yahoo-accounts': 'Mail',
  'outlook-accounts': 'Mail',
  'hotmail-accounts': 'Mail',
  'protonmail-accounts': 'Mail',
  'zoho-accounts': 'Mail',
  'business-email': 'Mail',
  'other-emails': 'Mail',
  netflix: 'Youtube',
  spotify: 'Music2',
  'disney-plus': 'Youtube',
  'prime-video': 'Youtube',
  crunchyroll: 'Youtube',
  hulu: 'Youtube',
  pubg: 'Trophy',
  'free-fire': 'Trophy',
  steam: 'Trophy',
  'epic-games': 'Trophy',
  playstation: 'Trophy',
  xbox: 'Trophy',
  ea: 'Trophy',
  'battle-net': 'Trophy',
  'riot-games': 'Trophy',
  roblox: 'Trophy',
  'mobile-legends': 'Trophy',
  valorant: 'Trophy',
  minecraft: 'Trophy',
  canva: 'Palette',
  chatgpt: 'Bot',
  midjourney: 'Bot',
  claude: 'Bot',
  gemini: 'Bot',
  cursor: 'Bot',
  elevenlabs: 'Bot',
  perplexity: 'Bot',
  envato: 'Layers',
  adobe: 'Palette',
  windows: 'Monitor',
  office: 'NotebookPen',
  'microsoft-365': 'Cloud',
  capcut: 'Film',
  grammarly: 'NotebookPen',
  jetbrains: 'Terminal',
  'expired-domains': 'Globe2',
  'premium-domains': 'Globe2',
  domains: 'Globe2',
  'shared-hosting': 'Server',
  vps: 'Server',
  rdp: 'Monitor',
  cpanel: 'Server',
  whm: 'Server',
  binance: 'Coins',
  bybit: 'Coins',
  coinbase: 'Coins',
  okx: 'Coins',
  kucoin: 'Coins',
  wallets: 'Wallet',
  scripts: 'Terminal',
  websites: 'Globe',
  'mobile-apps': 'Smartphone',
  themes: 'LayoutTemplate',
  plugins: 'Puzzle',
  saas: 'Cloud',
  proxy: 'Globe',
};

function childSlug(name) {
  return slugify(name.replace(/\+/g, ' plus ').replace(/\(x\)/gi, 'x'));
}

/**
 * Expand groups into create payloads (parents first, then children).
 * displayOrder follows MARKETPLACE_SERVICE_GROUPS array order (Services page).
 */
export function buildMarketplaceCategorySeedRows() {
  const rows = [];

  MARKETPLACE_SERVICE_GROUPS.forEach((group, rootIndex) => {
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

    const children = [...(group.children || [])];
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
