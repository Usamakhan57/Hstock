/**
 * Seed data for the mock admin backend. Shapes here should mirror what
 * the future MongoDB documents will look like (id, timestamps,
 * references by id) so the eventual migration is a data-shape match,
 * not a redesign.
 */

const img = {
  social: 'https://placehold.co/800x600/6C3BFF/FFFFFF?font=roboto&text=Social+Media',
  instagram: 'https://placehold.co/800x600/C026D3/FFFFFF?font=roboto&text=Instagram',
  facebook: 'https://placehold.co/800x600/6C3BFF/FFFFFF?font=roboto&text=Facebook',
  tiktok: 'https://placehold.co/800x600/171717/FFFFFF?font=roboto&text=TikTok',
  youtube: 'https://placehold.co/800x600/E11D48/FFFFFF?font=roboto&text=YouTube',
  twitter: 'https://placehold.co/800x600/0EA5E9/FFFFFF?font=roboto&text=Twitter+%2F+X',
  domain: 'https://placehold.co/800x600/8F63FF/FFFFFF?font=roboto&text=Premium+Domain',
  website: 'https://placehold.co/800x600/7A4DFF/FFFFFF?font=roboto&text=Website',
  saas: 'https://placehold.co/800x600/9A5CFF/FFFFFF?font=roboto&text=SaaS',
  sourceCode: 'https://placehold.co/800x600/A855F7/FFFFFF?font=roboto&text=Source+Code',
  mobileApp: 'https://placehold.co/800x600/D946EF/FFFFFF?font=roboto&text=Mobile+App',
  aiTool: 'https://placehold.co/800x600/FF4FD8/FFFFFF?font=roboto&text=AI+Tool',
  digitalAsset: 'https://placehold.co/800x600/8B5CF6/FFFFFF?font=roboto&text=Digital+Asset',
  template: 'https://placehold.co/800x600/F04FD8/FFFFFF?font=roboto&text=Template',
  course: 'https://placehold.co/800x600/6C3BFF/FFFFFF?font=roboto&text=Online+Course',
  ebook: 'https://placehold.co/800x600/8F63FF/FFFFFF?font=roboto&text=eBook',
  script: 'https://placehold.co/800x600/A855F7/FFFFFF?font=roboto&text=Script',

  // Legacy aliases — the Blog CMS, Homepage CMS, and Hero Slider content
  // below still predates the ApnaStore niche and hasn't been rewritten yet
  // (tracked as a follow-up content phase); these keep those existing
  // entries pointing at real images instead of breaking silently.
  wall: 'https://placehold.co/800x600/7A4DFF/FFFFFF?font=roboto&text=Websites',
  floral: 'https://placehold.co/800x600/F04FD8/FFFFFF?font=roboto&text=Templates',
  canva: 'https://placehold.co/800x600/6C3BFF/FFFFFF?font=roboto&text=Courses',
  font: 'https://placehold.co/800x600/8F63FF/FFFFFF?font=roboto&text=eBooks',
  color: 'https://placehold.co/800x600/A855F7/FFFFFF?font=roboto&text=Scripts',
  icons: 'https://placehold.co/800x600/FF4FD8/FFFFFF?font=roboto&text=AI+Tools',
  planner: 'https://placehold.co/800x600/9A5CFF/FFFFFF?font=roboto&text=SaaS',
  vector: 'https://placehold.co/800x600/8B5CF6/FFFFFF?font=roboto&text=Digital+Asset',
};

// Category model fields mirror what a future `categories` MongoDB
// document store would look like: unlimited nesting via `parentId`,
// `displayOrder` scoped to siblings (drives both admin reorder and the
// storefront), soft delete via `deletedAt`, and dedicated SEO fields so
// the frontend never needs hardcoded per-category copy.
// `productCount` is intentionally NOT stored here — it's always computed
// live from actual products (see productRepository.getProductCountByCategoryId),
// so it can never drift out of sync with reality.
const now = '2026-01-01T09:00:00.000Z';

export const seedCategories = [
  // --- Root categories ---
  {
    id: 'cat-social-accounts', name: 'Social Media Accounts', slug: 'social-media-accounts',
    description: 'Established Instagram, Facebook, TikTok, YouTube, and X accounts, transferred securely.',
    image: img.social, icon: 'Users', parentId: null, displayOrder: 0, status: 'active',
    featured: true, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Social Media Accounts | ApnaStore', metaDescription: 'Buy verified social media accounts across Instagram, Facebook, TikTok, YouTube, and X.', ogImage: img.social,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-domains', name: 'Domains', slug: 'domains',
    description: 'Premium, brandable, and aged domain names ready to transfer.',
    image: img.domain, icon: 'Globe2', parentId: null, displayOrder: 1, status: 'active',
    featured: true, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Domains | ApnaStore', metaDescription: 'Browse premium and aged domain names available for instant transfer on ApnaStore.', ogImage: img.domain,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-websites', name: 'Websites', slug: 'websites',
    description: 'Fully built, revenue-ready websites with source code and hosting handover.',
    image: img.website, icon: 'Globe', parentId: null, displayOrder: 2, status: 'active',
    featured: true, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Websites | ApnaStore', metaDescription: 'Buy fully built, ready-to-run websites complete with source code.', ogImage: img.website,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-saas', name: 'SaaS', slug: 'saas',
    description: 'SaaS boilerplates, starter kits, and ready-to-launch platforms.',
    image: img.saas, icon: 'Cloud', parentId: null, displayOrder: 3, status: 'active',
    featured: true, showInHeader: true, showOnHomepage: true,
    seoTitle: 'SaaS | ApnaStore', metaDescription: 'SaaS starter kits and ready-to-launch platforms with full source code.', ogImage: img.saas,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-source-code', name: 'Source Codes', slug: 'source-codes',
    description: 'Full application source code for web and e-commerce projects.',
    image: img.sourceCode, icon: 'FileCode2', parentId: null, displayOrder: 4, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Source Codes | ApnaStore', metaDescription: 'Full application source code, ready to deploy or customize.', ogImage: img.sourceCode,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-mobile-apps', name: 'Mobile Apps', slug: 'mobile-apps',
    description: 'iOS and Android app templates and full app source packages.',
    image: img.mobileApp, icon: 'Smartphone', parentId: null, displayOrder: 5, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Mobile Apps | ApnaStore', metaDescription: 'iOS and Android app templates and full mobile app source packages.', ogImage: img.mobileApp,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-ai-tools', name: 'AI Tools', slug: 'ai-tools',
    description: 'AI-powered tools and licenses for content, code, and automation.',
    image: img.aiTool, icon: 'Bot', parentId: null, displayOrder: 6, status: 'active',
    featured: true, showInHeader: true, showOnHomepage: true,
    seoTitle: 'AI Tools | ApnaStore', metaDescription: 'AI-powered tools and lifetime licenses for content, code, and automation.', ogImage: img.aiTool,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-digital-assets', name: 'Digital Assets', slug: 'digital-assets',
    description: 'A catch-all for standout digital assets that don\u2019t fit neatly into one category.',
    image: img.digitalAsset, icon: 'Layers', parentId: null, displayOrder: 7, status: 'inactive',
    featured: false, showInHeader: false, showOnHomepage: false,
    seoTitle: 'Digital Assets | ApnaStore', metaDescription: 'A mix of standout digital assets on ApnaStore.', ogImage: img.digitalAsset,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-templates', name: 'Templates', slug: 'templates',
    description: 'Website, document, and productivity templates ready to customize.',
    image: img.template, icon: 'LayoutTemplate', parentId: null, displayOrder: 8, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Templates | ApnaStore', metaDescription: 'Website, document, and productivity templates ready to customize.', ogImage: img.template,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-courses', name: 'Courses', slug: 'courses',
    description: 'Video courses covering development, marketing, and business skills.',
    image: img.course, icon: 'GraduationCap', parentId: null, displayOrder: 9, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Courses | ApnaStore', metaDescription: 'Video courses covering development, marketing, and business skills.', ogImage: img.course,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-ebooks', name: 'eBooks', slug: 'ebooks',
    description: 'Guides and eBooks on business, marketing, and self-improvement.',
    image: img.ebook, icon: 'BookOpen', parentId: null, displayOrder: 10, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: false,
    seoTitle: 'eBooks | ApnaStore', metaDescription: 'Guides and eBooks on business, marketing, and self-improvement.', ogImage: img.ebook,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-scripts', name: 'Scripts', slug: 'scripts',
    description: 'Automation scripts and small utilities for everyday workflows.',
    image: img.script, icon: 'Terminal', parentId: null, displayOrder: 11, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: false,
    seoTitle: 'Scripts | ApnaStore', metaDescription: 'Automation scripts and small utilities for everyday workflows.', ogImage: img.script,
    createdAt: now, updatedAt: now, deletedAt: null,
  },

  // --- Children of Social Media Accounts ---
  {
    id: 'cat-instagram', name: 'Instagram', slug: 'instagram', image: img.instagram,
    description: 'Instagram accounts across fashion, food, tech, and lifestyle niches.', icon: 'Instagram',
    parentId: 'cat-social-accounts', displayOrder: 0, status: 'active',
    featured: true, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Instagram Accounts | ApnaStore', metaDescription: 'Buy Instagram accounts across fashion, food, tech, and lifestyle niches.', ogImage: img.instagram,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-facebook', name: 'Facebook', slug: 'facebook', image: img.facebook,
    description: 'Facebook pages and groups with engaged, established audiences.', icon: 'Facebook',
    parentId: 'cat-social-accounts', displayOrder: 1, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: true,
    seoTitle: 'Facebook Pages | ApnaStore', metaDescription: 'Buy Facebook pages and groups with engaged, established audiences.', ogImage: img.facebook,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-tiktok', name: 'TikTok', slug: 'tiktok', image: img.tiktok,
    description: 'TikTok accounts with strong follower counts and watch time.', icon: 'Music2',
    parentId: 'cat-social-accounts', displayOrder: 2, status: 'active',
    featured: true, showInHeader: true, showOnHomepage: true,
    seoTitle: 'TikTok Accounts | ApnaStore', metaDescription: 'Buy TikTok accounts with strong follower counts and watch time.', ogImage: img.tiktok,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-youtube', name: 'YouTube', slug: 'youtube', image: img.youtube,
    description: 'Monetized YouTube channels across tech, gaming, and lifestyle.', icon: 'Youtube',
    parentId: 'cat-social-accounts', displayOrder: 3, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: false,
    seoTitle: 'YouTube Channels | ApnaStore', metaDescription: 'Buy monetized YouTube channels across tech, gaming, and lifestyle.', ogImage: img.youtube,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
  {
    id: 'cat-twitter', name: 'Twitter / X', slug: 'twitter-x', image: img.twitter,
    description: 'Verified and aged X (Twitter) accounts with real engagement.', icon: 'Twitter',
    parentId: 'cat-social-accounts', displayOrder: 4, status: 'active',
    featured: false, showInHeader: true, showOnHomepage: false,
    seoTitle: 'Twitter / X Accounts | ApnaStore', metaDescription: 'Buy verified and aged X (Twitter) accounts with real engagement.', ogImage: img.twitter,
    createdAt: now, updatedAt: now, deletedAt: null,
  },
];

export const seedBrands = [
  { id: 'brand-socialboost', name: 'SocialBoost', logo: img.social, website: 'https://socialboost.example.com', description: 'Vetted social media account transfers across every major platform.', status: 'active', productCount: 5 },
  { id: 'brand-domainvault', name: 'DomainVault', logo: img.domain, website: 'https://domainvault.example.com', description: 'Premium and aged domain names for brands and investors.', status: 'active', productCount: 1 },
  { id: 'brand-nexusapps', name: 'Nexus Apps', logo: img.mobileApp, website: 'https://nexusapps.example.com', description: 'SaaS platforms, websites, and mobile app source code.', status: 'active', productCount: 3 },
  { id: 'brand-codeforge', name: 'CodeForge Labs', logo: img.sourceCode, website: 'https://codeforgelabs.example.com', description: 'Production-ready source code, scripts, and AI tooling.', status: 'active', productCount: 3 },
  { id: 'brand-learnly', name: 'Learnly Studio', logo: img.course, website: '', description: 'Courses, templates, and eBooks for creators and founders.', status: 'active', productCount: 3 },
];

export const seedProducts = [
  { id: 'prod-1', title: 'Instagram Growth Account — 50K Followers (Fashion Niche)', slug: 'instagram-growth-account-50k-fashion', sku: 'HS-IG-001', categoryId: 'cat-instagram', brandId: 'brand-socialboost', tags: ['instagram', 'social-account', 'fashion'], fileTypes: ['Account Transfer'], licenseIds: ['personal', 'commercial'], price: 249, salePrice: 199, cost: 60, stock: 3, lowStockThreshold: 2, status: 'active', featured: true, thumbnail: img.instagram, gallery: [img.instagram, img.social], previewImages: [img.instagram], previewVideos: [], zipFile: { name: 'instagram-account-handover-guide.pdf', size: 1_200_000 }, description: 'An established, 50K-follower Instagram account in the fashion niche, with full email and 2FA handover.', whatsIncluded: 'Full account credentials, email access, 2FA transfer, and a step-by-step handover call.', faq: [{ question: 'How is the account transferred?', answer: 'We update the linked email and phone, then walk you through securing 2FA on your own devices.' }, { question: 'Is engagement organic?', answer: 'Yes — this account has been grown through organic content and collaborations, no bot followers.' }], metaTitle: 'Instagram Growth Account — 50K Followers | ApnaStore', metaDescription: 'Buy an established 50K-follower fashion Instagram account with full secure handover.', rating: 4.9, reviewCount: 41, downloads: 0, createdAt: '2025-11-02T10:00:00.000Z' },
  { id: 'prod-2', title: 'Aged Facebook Business Page — 100K Likes', slug: 'aged-facebook-business-page-100k-likes', sku: 'HS-FB-002', categoryId: 'cat-facebook', brandId: 'brand-socialboost', tags: ['facebook', 'social-account', 'business-page'], fileTypes: ['Account Transfer'], licenseIds: ['personal', 'commercial'], price: 179, salePrice: null, cost: 45, stock: 4, lowStockThreshold: 2, status: 'active', featured: false, thumbnail: img.facebook, gallery: [img.facebook], previewImages: [img.facebook], previewVideos: [], zipFile: null, description: 'A 6-year-old Facebook business page with 100K likes and steady organic reach.', whatsIncluded: 'Admin transfer, page insights export, and a handover checklist.', metaTitle: 'Aged Facebook Business Page — 100K Likes | ApnaStore', metaDescription: 'Buy an aged Facebook business page with 100K likes and steady organic reach.', rating: 4.7, reviewCount: 23, downloads: 0, createdAt: '2025-11-10T10:00:00.000Z' },
  { id: 'prod-3', title: 'TikTok Viral Account — 200K Followers (Comedy)', slug: 'tiktok-viral-account-200k-comedy', sku: 'HS-TT-003', categoryId: 'cat-tiktok', brandId: 'brand-socialboost', tags: ['tiktok', 'social-account', 'comedy'], fileTypes: ['Account Transfer'], licenseIds: ['personal', 'commercial'], price: 349, salePrice: 299, cost: 80, stock: 2, lowStockThreshold: 1, status: 'active', featured: true, thumbnail: img.tiktok, gallery: [img.tiktok, img.social], previewImages: [img.tiktok], previewVideos: [], zipFile: null, description: 'A comedy-niche TikTok account with 200K followers and multiple videos past 1M views.', whatsIncluded: 'Full login transfer, content calendar handoff, and posting-history export.', metaTitle: 'TikTok Viral Account — 200K Followers | ApnaStore', metaDescription: 'Buy a comedy-niche TikTok account with 200K followers and viral video history.', rating: 4.8, reviewCount: 35, downloads: 0, createdAt: '2025-12-01T10:00:00.000Z' },
  { id: 'prod-4', title: 'Monetized YouTube Channel — 10K Subs (Tech Reviews)', slug: 'monetized-youtube-channel-10k-tech', sku: 'HS-YT-004', categoryId: 'cat-youtube', brandId: 'brand-socialboost', tags: ['youtube', 'social-account', 'tech'], fileTypes: ['Account Transfer'], licenseIds: ['personal', 'commercial'], price: 899, salePrice: null, cost: 250, stock: 1, lowStockThreshold: 1, status: 'draft', featured: false, thumbnail: img.youtube, gallery: [img.youtube], previewImages: [img.youtube], previewVideos: [], zipFile: null, description: 'A fully monetized tech-review YouTube channel with 10K subscribers and consistent ad revenue.', whatsIncluded: 'AdSense-linked channel transfer, revenue history, and a 30-day support window.', metaTitle: 'Monetized YouTube Channel — 10K Subs | ApnaStore', metaDescription: 'Buy a monetized tech-review YouTube channel with 10K subscribers.', rating: 4.9, reviewCount: 12, downloads: 0, createdAt: '2025-12-05T10:00:00.000Z' },
  { id: 'prod-5', title: 'Verified Tech X (Twitter) Account — 30K Followers', slug: 'verified-tech-x-account-30k', sku: 'HS-TW-005', categoryId: 'cat-twitter', brandId: 'brand-socialboost', tags: ['twitter', 'x', 'social-account', 'tech'], fileTypes: ['Account Transfer'], licenseIds: ['personal', 'commercial'], price: 259, salePrice: 219, cost: 65, stock: 2, lowStockThreshold: 1, status: 'active', featured: false, thumbnail: img.twitter, gallery: [img.twitter], previewImages: [img.twitter], previewVideos: [], zipFile: null, description: 'A verified tech-niche X account with 30K engaged followers.', whatsIncluded: 'Verified badge transfer, email/2FA handover, and posting history.', metaTitle: 'Verified Tech X Account — 30K Followers | ApnaStore', metaDescription: 'Buy a verified tech-niche X (Twitter) account with 30K followers.', rating: 4.6, reviewCount: 18, downloads: 0, createdAt: '2025-12-10T10:00:00.000Z' },
  { id: 'prod-6', title: 'Premium Domain — cloudstack.io', slug: 'premium-domain-cloudstack-io', sku: 'HS-DM-006', categoryId: 'cat-domains', brandId: 'brand-domainvault', tags: ['domain', 'premium', 'saas-brand'], fileTypes: ['Domain Transfer'], licenseIds: ['commercial'], price: 1200, salePrice: 999, cost: 300, stock: 1, lowStockThreshold: 1, status: 'active', featured: true, thumbnail: img.domain, gallery: [img.domain], previewImages: [img.domain], previewVideos: [], zipFile: null, description: 'A short, brandable .io domain, ideal for a SaaS or developer-tools product.', whatsIncluded: 'Registrar transfer (push or auth-code), DNS handover, and ownership verification support.', metaTitle: 'Premium Domain — cloudstack.io | ApnaStore', metaDescription: 'Buy the premium, brandable domain cloudstack.io with a fast, secure transfer.', rating: 5.0, reviewCount: 6, downloads: 0, createdAt: '2026-01-04T10:00:00.000Z' },
  { id: 'prod-7', title: 'Invoicing SaaS Website — Fully Built with Source', slug: 'invoicing-saas-website-fully-built', sku: 'HS-WB-007', categoryId: 'cat-websites', brandId: 'brand-nexusapps', tags: ['website', 'saas', 'invoicing'], fileTypes: ['Live Website', 'Full Source Code'], licenseIds: ['commercial', 'extended'], price: 1499, salePrice: null, cost: 400, stock: 1, lowStockThreshold: 1, status: 'active', featured: true, thumbnail: img.website, gallery: [img.website, img.saas], previewImages: [img.website], previewVideos: [{ name: 'invoicing-saas-demo-walkthrough.mp4', size: 28_400_000 }], zipFile: { name: 'invoicing-saas-source.zip', size: 62_000_000 }, description: 'A fully built invoicing SaaS with Stripe billing, hosting handover, and complete source code.', whatsIncluded: 'Full source code, database export, hosting/domain handover checklist, and 14 days of setup support.', metaTitle: 'Invoicing SaaS Website — Fully Built | ApnaStore', metaDescription: 'Buy a fully built invoicing SaaS website with Stripe billing and full source code.', rating: 4.8, reviewCount: 9, downloads: 140, createdAt: '2026-01-15T10:00:00.000Z' },
  { id: 'prod-8', title: 'SaaS Starter Kit — Next.js + Stripe Boilerplate', slug: 'saas-starter-kit-nextjs-stripe', sku: 'HS-SS-008', categoryId: 'cat-saas', brandId: 'brand-nexusapps', tags: ['saas', 'nextjs', 'stripe', 'boilerplate'], fileTypes: ['Full Source Code'], licenseIds: ['personal', 'commercial', 'extended'], price: 129, salePrice: 89, cost: 15, stock: 999, lowStockThreshold: 20, status: 'active', featured: true, thumbnail: img.saas, gallery: [img.saas], previewImages: [img.saas], previewVideos: [{ name: 'saas-starter-kit-preview.mp4', size: 19_800_000 }], zipFile: { name: 'saas-starter-kit-nextjs-stripe.zip', size: 8_400_000 }, description: 'A production-ready Next.js + Stripe SaaS boilerplate with auth, billing, and a dashboard already wired up.', whatsIncluded: 'Full source code, environment setup guide, and Stripe webhook configuration docs.', faq: [{ question: 'Does this include a database?', answer: 'Yes, it ships with a Postgres schema and Prisma models ready to extend.' }], metaTitle: 'SaaS Starter Kit — Next.js + Stripe | ApnaStore', metaDescription: 'A production-ready Next.js + Stripe SaaS boilerplate with auth and billing built in.', rating: 4.9, reviewCount: 212, downloads: 1840, createdAt: '2026-01-20T10:00:00.000Z' },
  { id: 'prod-9', title: 'E-commerce Marketplace Source Code — MERN Stack', slug: 'ecommerce-marketplace-source-mern', sku: 'HS-SC-009', categoryId: 'cat-source-code', brandId: 'brand-codeforge', tags: ['source-code', 'mern', 'marketplace', 'ecommerce'], fileTypes: ['Full Source Code'], licenseIds: ['commercial', 'extended'], price: 249, salePrice: null, cost: 40, stock: 999, lowStockThreshold: 20, status: 'active', featured: false, thumbnail: img.sourceCode, gallery: [img.sourceCode], previewImages: [img.sourceCode], previewVideos: [], zipFile: { name: 'ecommerce-marketplace-mern.zip', size: 34_500_000 }, description: 'A complete multi-vendor marketplace built on MongoDB, Express, React, and Node.', whatsIncluded: 'Frontend + backend source, seed data, and setup documentation.', metaTitle: 'E-commerce Marketplace Source Code | ApnaStore', metaDescription: 'A complete multi-vendor MERN-stack marketplace source code package.', rating: 4.7, reviewCount: 76, downloads: 610, createdAt: '2026-01-25T10:00:00.000Z' },
  { id: 'prod-10', title: 'Fitness Tracker App Template — iOS + Android', slug: 'fitness-tracker-app-template-ios-android', sku: 'HS-MA-010', categoryId: 'cat-mobile-apps', brandId: 'brand-nexusapps', tags: ['mobile-app', 'react-native', 'fitness', 'template'], fileTypes: ['Full Source Code'], licenseIds: ['personal', 'commercial'], price: 199, salePrice: 149, cost: 30, stock: 999, lowStockThreshold: 20, status: 'active', featured: false, thumbnail: img.mobileApp, gallery: [img.mobileApp], previewImages: [img.mobileApp], previewVideos: [{ name: 'fitness-tracker-app-demo.mp4', size: 22_100_000 }], zipFile: { name: 'fitness-tracker-app-template.zip', size: 15_900_000 }, description: 'A React Native fitness-tracking app template for both iOS and Android, with workout logging and charts built in.', whatsIncluded: 'Full React Native source, backend API stub, and app-store submission checklist.', metaTitle: 'Fitness Tracker App Template | ApnaStore', metaDescription: 'A React Native fitness-tracking app template for iOS and Android.', rating: 4.6, reviewCount: 58, downloads: 890, createdAt: '2026-02-01T10:00:00.000Z' },
  { id: 'prod-11', title: 'AI Content Writer — Lifetime License', slug: 'ai-content-writer-lifetime-license', sku: 'HS-AI-011', categoryId: 'cat-ai-tools', brandId: 'brand-codeforge', tags: ['ai-tool', 'content', 'lifetime-license'], fileTypes: ['License Key'], licenseIds: ['personal', 'commercial'], price: 89, salePrice: 69, cost: 10, stock: 999, lowStockThreshold: 20, status: 'active', featured: true, thumbnail: img.aiTool, gallery: [img.aiTool], previewImages: [img.aiTool], previewVideos: [], zipFile: null, description: 'A lifetime license to an AI writing assistant for blog posts, ads, and product copy.', whatsIncluded: 'Lifetime license key, activation guide, and access to future updates.', metaTitle: 'AI Content Writer — Lifetime License | ApnaStore', metaDescription: 'Get a lifetime license to an AI writing assistant for blogs, ads, and product copy.', rating: 4.5, reviewCount: 134, downloads: 2210, createdAt: '2026-02-05T10:00:00.000Z' },
  { id: 'prod-12', title: 'Notion Productivity Template Bundle', slug: 'notion-productivity-template-bundle', sku: 'HS-TP-012', categoryId: 'cat-templates', brandId: 'brand-learnly', tags: ['template', 'notion', 'productivity'], fileTypes: ['Template File'], licenseIds: ['personal', 'commercial'], price: 19, salePrice: 12, cost: 2, stock: 999, lowStockThreshold: 20, status: 'active', featured: false, thumbnail: img.template, gallery: [img.template], previewImages: [img.template], previewVideos: [], zipFile: { name: 'notion-productivity-bundle.zip', size: 4_200_000 }, description: 'A bundle of Notion templates for goal tracking, habit building, and project planning.', whatsIncluded: 'Notion duplication links and a short setup video.', metaTitle: 'Notion Productivity Template Bundle | ApnaStore', metaDescription: 'A bundle of Notion templates for goal tracking, habits, and project planning.', rating: 4.8, reviewCount: 305, downloads: 4120, createdAt: '2026-02-10T10:00:00.000Z' },
  { id: 'prod-13', title: 'Complete Web Development Bootcamp — Video Course', slug: 'complete-web-development-bootcamp', sku: 'HS-CR-013', categoryId: 'cat-courses', brandId: 'brand-learnly', tags: ['course', 'web-development', 'video'], fileTypes: ['Video Course'], licenseIds: ['personal'], price: 79, salePrice: 49, cost: 8, stock: 999, lowStockThreshold: 20, status: 'active', featured: true, thumbnail: img.course, gallery: [img.course], previewImages: [img.course], previewVideos: [{ name: 'bootcamp-course-trailer.mp4', size: 41_000_000 }], zipFile: null, description: 'A complete video course covering front-end, back-end, and deployment for beginners.', whatsIncluded: 'Lifetime access to 40+ video lessons, project files, and a certificate of completion.', metaTitle: 'Complete Web Development Bootcamp | ApnaStore', metaDescription: 'A complete video course covering front-end, back-end, and deployment for beginners.', rating: 4.9, reviewCount: 512, downloads: 6340, createdAt: '2026-02-15T10:00:00.000Z' },
  { id: 'prod-14', title: 'Passive Income Blueprint — eBook', slug: 'passive-income-blueprint-ebook', sku: 'HS-EB-014', categoryId: 'cat-ebooks', brandId: 'brand-learnly', tags: ['ebook', 'business', 'passive-income'], fileTypes: ['PDF'], licenseIds: ['personal'], price: 15, salePrice: null, cost: 1, stock: 999, lowStockThreshold: 20, status: 'active', featured: false, thumbnail: img.ebook, gallery: [img.ebook], previewImages: [img.ebook], previewVideos: [], zipFile: { name: 'passive-income-blueprint.pdf', size: 3_100_000 }, description: 'A practical eBook on building digital income streams, from templates to SaaS.', whatsIncluded: 'PDF download and a bonus resource checklist.', metaTitle: 'Passive Income Blueprint — eBook | ApnaStore', metaDescription: 'A practical eBook on building digital income streams.', rating: 4.6, reviewCount: 87, downloads: 1930, createdAt: '2026-02-20T10:00:00.000Z' },
  { id: 'prod-15', title: 'Social Media Auto-Poster Script', slug: 'social-media-auto-poster-script', sku: 'HS-SP-015', categoryId: 'cat-scripts', brandId: 'brand-codeforge', tags: ['script', 'automation', 'social-media'], fileTypes: ['Full Source Code'], licenseIds: ['personal', 'commercial'], price: 59, salePrice: 39, cost: 5, stock: 999, lowStockThreshold: 20, status: 'active', featured: false, thumbnail: img.script, gallery: [img.script], previewImages: [img.script], previewVideos: [], zipFile: { name: 'social-auto-poster-script.zip', size: 2_800_000 }, description: 'A PHP script that schedules and auto-posts content across multiple social accounts.', whatsIncluded: 'Full PHP source, install guide, and API setup docs.', metaTitle: 'Social Media Auto-Poster Script | ApnaStore', metaDescription: 'A PHP script that schedules and auto-posts content across social accounts.', rating: 4.4, reviewCount: 44, downloads: 720, createdAt: '2026-03-01T10:00:00.000Z' },
];

export const seedCustomers = [
  { id: 'cust-1', name: 'Amelia Carter', email: 'amelia@example.com', phone: '+1 555-0101', status: 'active', totalOrders: 6, totalSpent: 1142.5, joinedAt: '2025-09-14T10:00:00.000Z' },
  { id: 'cust-2', name: 'Marcus Bailey', email: 'marcus@example.com', phone: '+1 555-0102', status: 'active', totalOrders: 3, totalSpent: 267.0, joinedAt: '2025-10-02T10:00:00.000Z' },
  { id: 'cust-3', name: 'Priya Nair', email: 'priya@example.com', phone: '+1 555-0103', status: 'active', totalOrders: 9, totalSpent: 1284.2, joinedAt: '2025-08-21T10:00:00.000Z' },
  { id: 'cust-4', name: 'Jordan King', email: 'jordan@example.com', phone: '+1 555-0104', status: 'suspended', totalOrders: 1, totalSpent: 89.0, joinedAt: '2025-12-01T10:00:00.000Z' },
  { id: 'cust-5', name: 'Sam Rivera', email: 'sam@example.com', phone: '+1 555-0105', status: 'active', totalOrders: 4, totalSpent: 398.4, joinedAt: '2026-01-05T10:00:00.000Z' },
  { id: 'cust-6', name: 'Taylor Moss', email: 'taylor@example.com', phone: '+1 555-0106', status: 'active', totalOrders: 2, totalSpent: 141.0, joinedAt: '2026-01-18T10:00:00.000Z' },
];

const oi = (productId, title, price, qty, licenseName) => ({ productId, title, price, qty, licenseName });

export const seedOrders = [
  { id: 'ord-1001', customerId: 'cust-1', customerName: 'Amelia Carter', email: 'amelia@example.com', items: [oi('prod-1', 'Instagram Growth Account — 50K Followers (Fashion Niche)', 199, 1, 'Commercial Use'), oi('prod-12', 'Notion Productivity Template Bundle', 12, 1, 'Personal Use')], total: 211, status: 'completed', paymentStatus: 'paid', paymentMethod: 'Card', createdAt: '2026-06-01T09:12:00.000Z' },
  { id: 'ord-1002', customerId: 'cust-2', customerName: 'Marcus Bailey', email: 'marcus@example.com', items: [oi('prod-13', 'Complete Web Development Bootcamp — Video Course', 49, 1, 'Personal Use')], total: 49, status: 'completed', paymentStatus: 'paid', paymentMethod: 'PayPal', createdAt: '2026-06-03T14:40:00.000Z' },
  { id: 'ord-1003', customerId: 'cust-3', customerName: 'Priya Nair', email: 'priya@example.com', items: [oi('prod-8', 'SaaS Starter Kit — Next.js + Stripe Boilerplate', 89, 1, 'Commercial Use')], total: 89, status: 'processing', paymentStatus: 'paid', paymentMethod: 'Card', createdAt: '2026-06-10T08:05:00.000Z' },
  { id: 'ord-1004', customerId: 'cust-5', customerName: 'Sam Rivera', email: 'sam@example.com', items: [oi('prod-14', 'Passive Income Blueprint — eBook', 15, 1, 'Personal Use'), oi('prod-15', 'Social Media Auto-Poster Script', 39, 1, 'Commercial Use')], total: 54, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'Bank Transfer', createdAt: '2026-06-14T17:22:00.000Z' },
  { id: 'ord-1005', customerId: 'cust-4', customerName: 'Jordan King', email: 'jordan@example.com', items: [oi('prod-11', 'AI Content Writer — Lifetime License', 69, 1, 'Personal Use')], total: 69, status: 'cancelled', paymentStatus: 'refunded', paymentMethod: 'Card', createdAt: '2026-06-16T11:00:00.000Z' },
  { id: 'ord-1006', customerId: 'cust-1', customerName: 'Amelia Carter', email: 'amelia@example.com', items: [oi('prod-10', 'Fitness Tracker App Template — iOS + Android', 149, 1, 'Personal Use')], total: 149, status: 'completed', paymentStatus: 'paid', paymentMethod: 'Card', createdAt: '2026-06-20T13:10:00.000Z' },
  { id: 'ord-1007', customerId: 'cust-6', customerName: 'Taylor Moss', email: 'taylor@example.com', items: [oi('prod-2', 'Aged Facebook Business Page — 100K Likes', 179, 1, 'Commercial Use')], total: 179, status: 'shipped', paymentStatus: 'paid', paymentMethod: 'PayPal', createdAt: '2026-06-25T09:47:00.000Z' },
  { id: 'ord-1008', customerId: 'cust-3', customerName: 'Priya Nair', email: 'priya@example.com', items: [oi('prod-3', 'TikTok Viral Account — 200K Followers (Comedy)', 299, 1, 'Commercial Use')], total: 299, status: 'completed', paymentStatus: 'paid', paymentMethod: 'Card', createdAt: '2026-07-01T10:30:00.000Z' },
  { id: 'ord-1009', customerId: 'cust-2', customerName: 'Marcus Bailey', email: 'marcus@example.com', items: [oi('prod-6', 'Premium Domain — cloudstack.io', 999, 1, 'Commercial Use')], total: 999, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'Bank Transfer', createdAt: '2026-07-08T16:15:00.000Z' },
  { id: 'ord-1010', customerId: 'cust-5', customerName: 'Sam Rivera', email: 'sam@example.com', items: [oi('prod-9', 'E-commerce Marketplace Source Code — MERN Stack', 249, 1, 'Extended Use')], total: 249, status: 'processing', paymentStatus: 'paid', paymentMethod: 'Card', createdAt: '2026-07-12T12:00:00.000Z' },
];

export const seedCoupons = [
  { id: 'cpn-1', code: 'WELCOME10', type: 'percent', value: 10, minSpend: 0, usageLimit: 500, usedCount: 213, status: 'active', expiresAt: '2026-12-31T00:00:00.000Z' },
  { id: 'cpn-2', code: 'SUMMER25', type: 'percent', value: 25, minSpend: 20, usageLimit: 200, usedCount: 88, status: 'active', expiresAt: '2026-08-31T00:00:00.000Z' },
  { id: 'cpn-3', code: 'FLAT5', type: 'fixed', value: 5, minSpend: 15, usageLimit: 1000, usedCount: 401, status: 'active', expiresAt: '2027-01-01T00:00:00.000Z' },
  { id: 'cpn-4', code: 'VIP50', type: 'percent', value: 50, minSpend: 50, usageLimit: 50, usedCount: 50, status: 'expired', expiresAt: '2026-05-01T00:00:00.000Z' },
  { id: 'cpn-5', code: 'HOLIDAY15', type: 'percent', value: 15, minSpend: 0, usageLimit: 300, usedCount: 0, status: 'scheduled', expiresAt: '2026-12-26T00:00:00.000Z' },
];

export const seedReviews = [
  { id: 'rev-1', productId: 'prod-1', productTitle: 'Instagram Growth Account — 50K Followers (Fashion Niche)', customerName: 'Jordan K.', rating: 5, comment: 'Handover was smooth and the account was exactly as described.', status: 'approved', createdAt: '2026-06-05T10:00:00.000Z' },
  { id: 'rev-2', productId: 'prod-8', productTitle: 'SaaS Starter Kit — Next.js + Stripe Boilerplate', customerName: 'Sam R.', rating: 4, comment: 'Saved me weeks of setup, great documentation.', status: 'approved', createdAt: '2026-06-08T10:00:00.000Z' },
  { id: 'rev-3', productId: 'prod-13', productTitle: 'Complete Web Development Bootcamp — Video Course', customerName: 'Taylor M.', rating: 5, comment: 'Best course I have taken on this topic, very thorough.', status: 'approved', createdAt: '2026-06-11T10:00:00.000Z' },
  { id: 'rev-4', productId: 'prod-15', productTitle: 'Social Media Auto-Poster Script', customerName: 'Casey B.', rating: 2, comment: 'Script works but the setup docs could be clearer.', status: 'pending', createdAt: '2026-07-01T10:00:00.000Z' },
  { id: 'rev-5', productId: 'prod-3', productTitle: 'TikTok Viral Account — 200K Followers (Comedy)', customerName: 'Riley P.', rating: 5, comment: 'Engagement is exactly as advertised, would buy again.', status: 'pending', createdAt: '2026-07-05T10:00:00.000Z' },
  { id: 'rev-6', productId: 'prod-6', productTitle: 'Premium Domain — cloudstack.io', customerName: 'Drew A.', rating: 1, comment: 'Transfer took much longer than the listing implied.', status: 'rejected', createdAt: '2026-07-06T10:00:00.000Z' },
];

export const seedMedia = [
  { id: 'med-1', filename: 'instagram-growth-account.png', url: img.instagram, type: 'image/png', size: 2_400_000, uploadedAt: '2025-11-02T10:00:00.000Z' },
  { id: 'med-2', filename: 'facebook-business-page.png', url: img.facebook, type: 'image/png', size: 1_800_000, uploadedAt: '2025-11-10T10:00:00.000Z' },
  { id: 'med-3', filename: 'tiktok-viral-account.png', url: img.tiktok, type: 'image/png', size: 1_200_000, uploadedAt: '2025-12-01T10:00:00.000Z' },
  { id: 'med-4', filename: 'youtube-monetized-channel.png', url: img.youtube, type: 'image/png', size: 980_000, uploadedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'med-5', filename: 'premium-domain-cloudstack.png', url: img.domain, type: 'image/png', size: 1_500_000, uploadedAt: '2026-01-04T10:00:00.000Z' },
  { id: 'med-6', filename: 'saas-starter-kit-cover.png', url: img.saas, type: 'image/png', size: 3_100_000, uploadedAt: '2026-01-20T10:00:00.000Z' },
  { id: 'med-7', filename: 'fitness-tracker-app-cover.png', url: img.mobileApp, type: 'image/png', size: 2_050_000, uploadedAt: '2026-02-01T10:00:00.000Z' },
  { id: 'med-8', filename: 'ai-content-writer-cover.png', url: img.aiTool, type: 'image/png', size: 1_650_000, uploadedAt: '2026-02-05T10:00:00.000Z' },
];

export const seedBanners = [
  { id: 'ban-1', title: 'Summer Sale — Up to 40% Off Social Accounts', image: img.social, mobileImage: '', link: '/shop?search=sale', buttonText: 'Shop the Sale', position: 'homepage', status: 'active', startAt: '2026-06-01T00:00:00.000Z', endAt: '2026-08-31T00:00:00.000Z' },
  { id: 'ban-2', title: 'New Arrivals: Premium Domains', image: img.domain, mobileImage: '', link: '/shop?search=Domain', buttonText: 'Explore Domains', position: 'shop', status: 'active', startAt: '2026-06-15T00:00:00.000Z', endAt: '2026-12-31T00:00:00.000Z' },
  { id: 'ban-3', title: 'Launch Your SaaS — Starter Kits', image: img.saas, mobileImage: '', link: '/shop?search=SaaS', buttonText: 'Shop SaaS Kits', position: 'category', status: 'scheduled', startAt: '2026-08-01T00:00:00.000Z', endAt: '2026-09-15T00:00:00.000Z' },
  { id: 'ban-4', title: 'AI Tools Launch Week', image: img.aiTool, mobileImage: '', link: '/shop?search=AI', buttonText: 'Shop Now', position: 'sale', status: 'draft', startAt: '2026-11-01T00:00:00.000Z', endAt: '2026-12-25T00:00:00.000Z' },
];

export const seedUsers = [
  { id: 'usr-1', name: 'Ava Thompson', email: 'ava@apnastore.org', role: 'Admin', status: 'active', lastLoginAt: '2026-07-15T09:00:00.000Z' },
  { id: 'usr-2', name: 'Liam Chen', email: 'liam@apnastore.org', role: 'Editor', status: 'active', lastLoginAt: '2026-07-14T15:20:00.000Z' },
  { id: 'usr-3', name: 'Noor Hassan', email: 'noor@apnastore.org', role: 'Support', status: 'active', lastLoginAt: '2026-07-10T11:45:00.000Z' },
  { id: 'usr-4', name: 'Diego Alvarez', email: 'diego@apnastore.org', role: 'Editor', status: 'invited', lastLoginAt: null },
  { id: 'usr-5', name: 'Mei Lin', email: 'mei@apnastore.org', role: 'Support', status: 'suspended', lastLoginAt: '2026-05-02T08:00:00.000Z' },
];

// Marketplace vendors (distinct from admin Users above, which are internal
// staff accounts). Sellers go through Approve/Reject/Suspend workflows.
export const seedSellers = [
  { id: 'sell-1', storeName: 'SocialBoost', ownerName: 'Hana Kobayashi', email: 'hana@socialboost.example.com', phone: '+1 555-0201', status: 'approved', verified: true, specialty: 'Social Media Accounts', bio: 'SocialBoost vets and transfers established social media accounts across Instagram, Facebook, TikTok, YouTube, and X, with a full secure-handover process on every sale.', productsCount: 5, totalSales: 1412.6, commissionRate: 15, joinedAt: '2025-10-01T10:00:00.000Z' },
  { id: 'sell-2', storeName: 'DomainVault', ownerName: 'Elena Petrova', email: 'elena@domainvault.example.com', phone: '+1 555-0202', status: 'approved', verified: true, specialty: 'Domains', bio: 'DomainVault sources premium, brandable, and aged domain names for founders and investors, handling registrar transfer end to end.', productsCount: 1, totalSales: 999.0, commissionRate: 12, joinedAt: '2025-10-20T10:00:00.000Z' },
  { id: 'sell-3', storeName: 'Nexus Apps', ownerName: 'Theo Marsh', email: 'theo@nexusapps.example.com', phone: '+1 555-0203', status: 'approved', verified: true, specialty: 'SaaS & Mobile Apps', bio: 'Nexus Apps builds fully-working SaaS platforms, websites, and mobile app templates, delivered with complete source code and setup support.', productsCount: 3, totalSales: 1896.0, commissionRate: 15, joinedAt: '2025-11-05T10:00:00.000Z' },
  { id: 'sell-4', storeName: 'CodeForge Labs', ownerName: 'Ravi Menon', email: 'ravi@codeforgelabs.example.com', phone: '+1 555-0204', status: 'approved', verified: true, specialty: 'Source Code & AI Tools', bio: 'CodeForge Labs ships production-ready source code, automation scripts, and AI-powered tooling for developers and small teams.', productsCount: 3, totalSales: 612.0, commissionRate: 15, joinedAt: '2026-06-28T10:00:00.000Z' },
  { id: 'sell-5', storeName: 'Learnly Studio', ownerName: 'Casey Grant', email: 'casey@learnlystudio.example.com', phone: '+1 555-0205', status: 'approved', verified: false, specialty: 'Courses & Templates', bio: 'Learnly Studio creates practical courses, templates, and eBooks to help creators and new founders get moving faster.', productsCount: 3, totalSales: 943.5, commissionRate: 15, joinedAt: '2025-12-12T10:00:00.000Z' },
  { id: 'sell-6', storeName: 'Driftwood Digital', ownerName: 'Ines Oliveira', email: 'ines@driftwooddigital.example.com', phone: '+1 555-0206', status: 'pending', verified: false, specialty: '', bio: '', productsCount: 0, totalSales: 0, commissionRate: 15, joinedAt: '2026-07-10T10:00:00.000Z' },
  { id: 'sell-7', storeName: 'Quiet Forms Studio', ownerName: 'Malik Freeman', email: 'malik@quietforms.example.com', phone: '+1 555-0207', status: 'rejected', verified: false, specialty: '', bio: '', productsCount: 0, totalSales: 0, commissionRate: 15, joinedAt: '2026-05-18T10:00:00.000Z' },
];


export const seedStockLog = [];

export const seedSettings = {
  storeName: 'ApnaStore',
  storeEmail: 'hello@apnastore.org',
  storePhone: '+1 555-010-0000',
  address: '123 Market Street, Suite 400, San Francisco, CA',
  currency: 'USD',
  timezone: 'America/Los_Angeles',
  logo: '',
  taxRatePercent: 0,
  flatShippingFee: 0,
  emailNewOrder: true,
  emailLowStock: true,
  emailNewReview: false,
  maintenanceMode: false,
  // Shipping & fees — future-ready for physical products; digital-only today.
  shippingZones: [
    { id: 'zone-1', name: 'Domestic (US)', countries: 'United States', rate: 0 },
    { id: 'zone-2', name: 'International', countries: 'Rest of World', rate: 0 },
  ],
  shippingMethods: [
    { id: 'method-1', name: 'Instant Digital Delivery', cost: 0, estimatedDays: 'Instant' },
  ],
  taxRules: [
    { id: 'tax-1', region: 'United States', rate: 0, taxClass: 'Digital Goods' },
  ],
  platformFeePercent: 2,
  commissionRules: [
    { id: 'comm-1', scope: 'All Categories', rate: 15 },
  ],
};

// ---------------------------------------------------------------------
// BLOG CMS — authors, posts, categories, tags, comments (future-ready),
// revisions (future-ready), settings. Shapes mirror what future
// `blog_authors` / `posts` / `blog_categories` / `blog_tags` /
// `blog_comments` / `blog_post_revisions` / `blog_settings` stores
// would look like so wiring a real backend later is a data-shape match,
// not a redesign.
// ---------------------------------------------------------------------

export const seedBlogAuthors = [
  {
    id: 'author-apnastore-team', name: 'ApnaStore Team', avatar: img.font,
    bio: 'The team behind ApnaStore, writing about digital products, licensing, and everything else that helps sellers succeed.',
    socialLinks: [{ platform: 'website', url: 'https://apnastore.org' }, { platform: 'twitter', url: 'https://twitter.com/apnastore' }],
  },
  {
    id: 'author-petal-ink', name: 'Petal & Ink', avatar: img.floral,
    bio: 'Hand-painted watercolor florals and behind-the-scenes process notes from the Petal & Ink studio.',
    socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/petalandink' }],
  },
  {
    id: 'author-pixel-craft', name: 'Pixel Craft', avatar: img.icons,
    bio: 'High-volume PNG bundles and practical business advice for print-on-demand sellers.',
    socialLinks: [{ platform: 'website', url: 'https://pixelcraft.example.com' }],
  },
  {
    id: 'author-daily-flow', name: 'Daily Flow', avatar: img.planner,
    bio: 'Digital planner design trends and productivity-first spreads.',
    socialLinks: [{ platform: 'twitter', url: 'https://twitter.com/dailyflow' }],
  },
];

export const seedBlogCategories = [
  { id: 'bcat-guides', name: 'Guides', slug: 'guides', description: 'Practical how-tos for using and selling digital downloads.', icon: 'BookOpen', image: img.font, status: 'active', order: 0, postCount: 1 },
  { id: 'bcat-inspiration', name: 'Inspiration', slug: 'inspiration', description: 'Creative ways to use ApnaStore assets.', icon: 'Sparkles', image: img.floral, status: 'active', order: 1, postCount: 1 },
  { id: 'bcat-business', name: 'Business', slug: 'business', description: 'Running and growing a digital shop.', icon: 'Briefcase', image: img.icons, status: 'active', order: 2, postCount: 1 },
  { id: 'bcat-trends', name: 'Trends', slug: 'trends', description: 'What is shaping design and digital products this year.', icon: 'TrendingUp', image: img.planner, status: 'active', order: 3, postCount: 1 },
  { id: 'bcat-behind-the-scenes', name: 'Behind the Scenes', slug: 'behind-the-scenes', description: 'How our sellers make what they make.', icon: 'Camera', image: img.color, status: 'active', order: 4, postCount: 1 },
];

export const seedBlogTags = [
  { id: 'btag-license', name: 'Licensing', slug: 'licensing', postCount: 1 },
  { id: 'btag-clipart', name: 'Clipart', slug: 'clipart', postCount: 2 },
  { id: 'btag-pod', name: 'Print on Demand', slug: 'print-on-demand', postCount: 1 },
  { id: 'btag-planner', name: 'Planners', slug: 'planners', postCount: 2 },
  { id: 'btag-watercolor', name: 'Watercolor', slug: 'watercolor', postCount: 1 },
  { id: 'btag-tutorial', name: 'Tutorial', slug: 'tutorial', postCount: 0 },
];

// `deletedAt` is null for a live post; setting it moves a post to Trash
// (soft delete) without removing its row, so Restore is just clearing
// the field back to null. `version` / `lastModified` (= updatedAt) /
// `modifiedBy` back the Revisions UI; the SEO fields cover canonical,
// robots, Open Graph, and Twitter Card independently of the base fields.
export const seedBlogPosts = [
  {
    id: 'post-1', title: 'Choosing the Right License for Your Project', slug: 'choosing-the-right-license',
    excerpt: 'Personal, Commercial, or Extended — here is how to pick the license that actually matches how you plan to use your download.',
    content: 'Every product on ApnaStore ships with at least one license tier, and picking the right one is less about the price and more about what you plan to do with the file after checkout.\n\nA Personal license covers gifts, home projects, and anything that never touches a sale. A Commercial license opens the door to client work and limited-run resale, while Extended Commercial removes the sales cap entirely for agencies and high-volume shops.\n\nWhen in doubt, start with the smallest license that covers your current project — you can always come back and upgrade later if your use case grows.',
    categoryId: 'bcat-guides', tags: ['btag-license', 'btag-tutorial'], authorId: 'author-apnastore-team',
    featuredImage: img.font, gallery: [img.font], status: 'published', featured: true, trending: false, editorsPick: true,
    readingTime: '5 min read',
    seoTitle: 'Choosing the Right License for Your Project | ApnaStore', metaDescription: 'How to pick the license tier that matches how you plan to use your download.', focusKeyword: 'digital product license',
    canonicalUrl: '', robotsIndex: true, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: img.font,
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-06-10T09:00:00.000Z', updatedAt: '2026-06-18T09:00:00.000Z', publishedAt: '2026-06-18T09:00:00.000Z', views: 4210,
    version: 3, modifiedBy: 'Admin', deletedAt: null,
  },
  {
    id: 'post-2', title: '5 Ways to Use Clipart Beyond the Obvious', slug: 'five-ways-to-use-clipart',
    excerpt: 'Clipart is not just for scrapbooking — see how sellers are using it in packaging, social templates, and more.',
    content: 'Clipart libraries are often thought of as a scrapbooking tool, but the most creative shop owners are using them everywhere from product packaging to social media templates.\n\nTry layering clipart elements behind your logo for packaging inserts, or use single elements as accent graphics in a slide deck or newsletter header.\n\nThe key is treating each element as a flexible building block rather than a finished graphic — resize, recolor, and recombine to get something that feels custom.',
    categoryId: 'bcat-inspiration', tags: ['btag-clipart'], authorId: 'author-petal-ink',
    featuredImage: img.floral, gallery: [img.floral], status: 'published', featured: true, trending: true, editorsPick: false,
    readingTime: '4 min read',
    seoTitle: '5 Ways to Use Clipart Beyond the Obvious | ApnaStore', metaDescription: 'Creative, non-obvious ways sellers are using clipart bundles.', focusKeyword: 'clipart ideas',
    canonicalUrl: '', robotsIndex: true, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: img.floral,
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-05-28T09:00:00.000Z', updatedAt: '2026-06-05T09:00:00.000Z', publishedAt: '2026-06-05T09:00:00.000Z', views: 3110,
    version: 2, modifiedBy: 'Admin', deletedAt: null,
  },
  {
    id: 'post-3', title: 'Setting Up Your Print-on-Demand Shop in a Weekend', slug: 'setting-up-your-print-on-demand-shop',
    excerpt: 'A practical, no-fluff walkthrough for turning a folder of downloads into a live storefront.',
    content: 'You do not need months of planning to launch a print-on-demand shop — with the right assets, a weekend is plenty of time.\n\nStart by picking one tight niche and 10-15 designs with a commercial license, then mock them up on your chosen products using a free mockup generator.\n\nList your first batch, set realistic shipping expectations, and treat your first two weeks as a feedback loop rather than a finish line.',
    categoryId: 'bcat-business', tags: ['btag-pod'], authorId: 'author-pixel-craft',
    featuredImage: img.icons, gallery: [img.icons], status: 'published', featured: false, trending: true, editorsPick: false,
    readingTime: '7 min read',
    seoTitle: 'Setting Up Your Print-on-Demand Shop in a Weekend | ApnaStore', metaDescription: 'A no-fluff walkthrough for launching a print-on-demand shop fast.', focusKeyword: 'print on demand shop',
    canonicalUrl: '', robotsIndex: true, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: img.icons,
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-05-15T09:00:00.000Z', updatedAt: '2026-05-22T09:00:00.000Z', publishedAt: '2026-05-22T09:00:00.000Z', views: 2870,
    version: 1, modifiedBy: 'Admin', deletedAt: null,
  },
  {
    id: 'post-4', title: '2026 Trends in Digital Planning', slug: 'trends-in-digital-planning',
    excerpt: 'From hyperlinked spreads to minimalist widgets, here is what is shaping digital planner design this year.',
    content: 'Digital planning has moved well past simple PDF grids — this year most popular spreads lean on deep hyperlinking so every tap feels instant.\n\nMinimalist, low-contrast palettes are trending over busy stickers, giving planners a calmer, more focused feel on-screen.\n\nExpect to see more modular spreads too, where users mix and match widgets like habit trackers and mood logs instead of one fixed layout.',
    categoryId: 'bcat-trends', tags: ['btag-planner'], authorId: 'author-daily-flow',
    featuredImage: img.planner, gallery: [img.planner], status: 'published', featured: false, trending: false, editorsPick: true,
    readingTime: '4 min read',
    seoTitle: '2026 Trends in Digital Planning | ApnaStore', metaDescription: 'What is shaping digital planner design in 2026.', focusKeyword: 'digital planner trends',
    canonicalUrl: '', robotsIndex: true, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: img.planner,
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-04-22T09:00:00.000Z', updatedAt: '2026-04-30T09:00:00.000Z', publishedAt: '2026-04-30T09:00:00.000Z', views: 1980,
    version: 1, modifiedBy: 'Admin', deletedAt: null,
  },
  {
    id: 'post-5', title: 'Behind the Scenes: Our Watercolor Technique', slug: 'watercolor-technique-breakdown',
    excerpt: 'A peek into how our best-selling floral clipart sets go from real paint to layered PNG files.',
    content: 'Every floral element starts as a real watercolor painting on cold-press paper, scanned at high resolution to preserve the texture of the pigment.\n\nFrom there, each piece is hand-cut in layers so shadows and highlights stay separate, which is what lets you recolor elements without losing the painted texture.\n\nThe final export pass checks every file at multiple sizes to make sure the details still hold up whether it is printed at 3 inches or 30.',
    categoryId: 'bcat-behind-the-scenes', tags: ['btag-watercolor', 'btag-clipart'], authorId: 'author-petal-ink',
    featuredImage: img.color, gallery: [img.color, img.floral], status: 'published', featured: false, trending: false, editorsPick: false,
    readingTime: '6 min read',
    seoTitle: 'Behind the Scenes: Our Watercolor Technique | ApnaStore', metaDescription: 'How our floral clipart sets go from real paint to layered PNG files.', focusKeyword: 'watercolor clipart process',
    canonicalUrl: '', robotsIndex: true, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: img.color,
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-04-02T09:00:00.000Z', updatedAt: '2026-04-11T09:00:00.000Z', publishedAt: '2026-04-11T09:00:00.000Z', views: 1540,
    version: 1, modifiedBy: 'Admin', deletedAt: null,
  },
  {
    id: 'post-6', title: 'A First Look at Our Q3 Roadmap', slug: 'q3-roadmap-preview',
    excerpt: 'A short preview of what the team is shipping next quarter — still being finalized.',
    content: 'We are heads-down on a handful of seller-requested features for next quarter.\n\nThis post is still a work in progress and will be expanded closer to launch.',
    categoryId: 'bcat-business', tags: [], authorId: 'author-apnastore-team',
    featuredImage: img.vector, gallery: [], status: 'draft', featured: false, trending: false, editorsPick: false,
    readingTime: '2 min read',
    seoTitle: '', metaDescription: '', focusKeyword: '',
    canonicalUrl: '', robotsIndex: true, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: '',
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-07-01T09:00:00.000Z', updatedAt: '2026-07-10T09:00:00.000Z', publishedAt: null, views: 0,
    version: 1, modifiedBy: 'Admin', deletedAt: null,
  },
  {
    id: 'post-7', title: 'Fall Refresh: New Marketplace Drops', slug: 'fall-refresh-marketplace-drops',
    excerpt: 'A scheduled announcement for the upcoming seasonal marketplace drop.',
    content: 'Our fall marketplace drop is coming soon with new digital listings across top categories.\n\nCheck back for the full lineup on release day.',
    categoryId: 'bcat-trends', tags: ['btag-planner'], authorId: 'author-daily-flow',
    featuredImage: img.planner, gallery: [], status: 'scheduled', featured: false, trending: false, editorsPick: false,
    readingTime: '3 min read',
    seoTitle: 'Fall Refresh: New Marketplace Drops | ApnaStore', metaDescription: 'A first look at seasonal digital asset drops on ApnaStore.', focusKeyword: 'fall marketplace drops',
    canonicalUrl: '', robotsIndex: true, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: img.planner,
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-07-05T09:00:00.000Z', updatedAt: '2026-07-12T09:00:00.000Z', publishedAt: '2026-08-01T09:00:00.000Z', views: 0,
    version: 1, modifiedBy: 'Admin', deletedAt: null,
  },
  {
    id: 'post-8', title: 'Why We Retired Our Old Sticker Pack', slug: 'retired-old-sticker-pack',
    excerpt: 'An older post kept only for reference — moved to Trash as a soft-delete example.',
    content: 'This post has been retired and moved to Trash.\n\nIt is kept here only to demonstrate the Trash / Restore / Permanently Delete workflow.',
    categoryId: 'bcat-inspiration', tags: [], authorId: 'author-petal-ink',
    featuredImage: img.floral, gallery: [], status: 'draft', featured: false, trending: false, editorsPick: false,
    readingTime: '2 min read',
    seoTitle: '', metaDescription: '', focusKeyword: '',
    canonicalUrl: '', robotsIndex: false, robotsFollow: true,
    ogTitle: '', ogDescription: '', ogImage: '',
    twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
    createdAt: '2026-02-01T09:00:00.000Z', updatedAt: '2026-02-15T09:00:00.000Z', publishedAt: null, views: 12,
    version: 2, modifiedBy: 'Admin', deletedAt: '2026-07-15T09:00:00.000Z',
  },
];

// Comments are future-ready: modeled and wired into the Admin nav/API now
// so the page and data shape already exist, even though nothing on the
// live frontend posts comments yet.
export const seedBlogComments = [];

// Revisions are future-ready: the resource, service functions, and a
// read-only "Version History" panel in the post editor all exist now.
// Only a couple of posts have seeded history, purely to demonstrate the
// UI — real snapshotting arrives with the backend.
export const seedBlogRevisions = [
  { id: 'rev-1', postId: 'post-1', version: 1, modifiedBy: 'Admin', createdAt: '2026-06-10T09:00:00.000Z', summary: 'Initial draft created' },
  { id: 'rev-2', postId: 'post-1', version: 2, modifiedBy: 'Admin', createdAt: '2026-06-15T10:00:00.000Z', summary: 'Expanded licensing examples' },
  { id: 'rev-3', postId: 'post-1', version: 3, modifiedBy: 'Admin', createdAt: '2026-06-18T09:00:00.000Z', summary: 'Published' },
  { id: 'rev-4', postId: 'post-2', version: 1, modifiedBy: 'Admin', createdAt: '2026-05-28T09:00:00.000Z', summary: 'Initial draft created' },
  { id: 'rev-5', postId: 'post-2', version: 2, modifiedBy: 'Admin', createdAt: '2026-06-05T09:00:00.000Z', summary: 'Published' },
];

export const seedBlogSettings = {
  pageTitle: 'The ApnaStore Blog',
  heroHeading: 'The ApnaStore Blog',
  heroDescription: 'Guides, inspiration, and behind-the-scenes stories from our team and top sellers.',
  featuredCategoryIds: ['bcat-guides', 'bcat-inspiration', 'bcat-business', 'bcat-trends'],
  postsPerPage: 9,
  enableSearch: true,
  enableCategories: true,
  enableRelatedPosts: true,
  enableNewsletter: true,
  defaultAuthorId: 'author-apnastore-team',
  defaultOgImage: img.font,
  defaultSeoTitle: 'Blog — Guides & Inspiration | ApnaStore',
  defaultMetaDescription: 'Guides and marketplace tips from the ApnaStore team for buyers and sellers.',
  // Dynamic copy — every user-facing label on the Blog page is
  // configurable here so nothing is hardcoded in frontend components.
  searchPlaceholder: 'Search articles…',
  allCategoriesLabel: 'All',
  featuredSectionHeading: 'Featured',
  noResultsTitle: 'No posts found',
  noResultsDescription: 'Try a different category or search term.',
  loadMoreButtonLabel: 'Load more articles',
  newsletterHeading: 'Get new articles in your inbox',
  newsletterDescription: 'Guides and inspiration, once or twice a month. No spam.',
  newsletterPlaceholder: 'you@email.com',
  newsletterButtonLabel: 'Subscribe',
};

// Homepage CMS — every section a shopper sees on the storefront home
// page, in the order they render. Admins can enable/disable, rename,
// reorder, cap product counts, and set imagery/CTAs per section without
// touching code. `type` drives which fields the admin UI shows for a
// given section, and later which storefront component/query it maps to.
export const seedHomepageCms = {
  sections: [
    {
      key: 'hero', type: 'hero', label: 'Hero Section', enabled: true, sortOrder: 1,
      title: 'Digital assets for creators who ship', subtitle: 'Handpicked templates, mockups & fonts',
      description: '', maxProducts: null, backgroundImage: img.wall, buttonText: 'Explore the Shop', buttonUrl: '/shop',
    },
    {
      key: 'featured_categories', type: 'categories', label: 'Featured Categories', enabled: true, sortOrder: 2,
      title: 'Shop by Category', subtitle: 'Find exactly what your project needs',
      description: '', maxProducts: 8, backgroundImage: '', buttonText: 'View All Categories', buttonUrl: '/categories',
    },
    {
      key: 'featured_categories', type: 'categories', label: 'Featured Categories', enabled: true, sortOrder: 3,
      title: 'Popular Categories', subtitle: 'Browse top marketplace categories',
      description: '', maxProducts: 6, backgroundImage: '', buttonText: 'View All Categories', buttonUrl: '/categories',
    },
    {
      key: 'featured_products', type: 'products', label: 'Featured Products', enabled: true, sortOrder: 4,
      title: 'Featured', subtitle: 'Editor\u2019s picks this week',
      description: '', maxProducts: 12, backgroundImage: '', buttonText: 'Shop Featured', buttonUrl: '/shop?featured=true',
    },
    {
      key: 'trending_products', type: 'products', label: 'Trending Products', enabled: true, sortOrder: 5,
      title: 'Trending Now', subtitle: 'What everyone\u2019s downloading this week',
      description: '', maxProducts: 12, backgroundImage: '', buttonText: 'See What\u2019s Trending', buttonUrl: '/shop?sort=trending',
    },
    {
      key: 'new_arrivals', type: 'products', label: 'New Arrivals', enabled: true, sortOrder: 6,
      title: 'New Arrivals', subtitle: 'Fresh from our sellers',
      description: '', maxProducts: 12, backgroundImage: '', buttonText: 'Shop New Arrivals', buttonUrl: '/shop?sort=newest',
    },
    {
      key: 'best_sellers', type: 'products', label: 'Best Sellers', enabled: true, sortOrder: 7,
      title: 'Best Sellers', subtitle: 'Most loved by our customers',
      description: '', maxProducts: 12, backgroundImage: '', buttonText: 'Shop Best Sellers', buttonUrl: '/shop?sort=best-selling',
    },
    {
      key: 'recommended_products', type: 'products', label: 'Recommended Products', enabled: false, sortOrder: 8,
      title: 'Recommended For You', subtitle: 'Based on what you\u2019ve viewed',
      description: '', maxProducts: 12, backgroundImage: '', buttonText: 'See More', buttonUrl: '/shop',
    },
    {
      key: 'popular_sellers', type: 'sellers', label: 'Popular Sellers', enabled: true, sortOrder: 9,
      title: 'Popular Sellers', subtitle: 'Top-rated shops on ApnaStore',
      description: '', maxProducts: 8, backgroundImage: '', buttonText: 'Browse All Sellers', buttonUrl: '/sellers',
    },
    {
      key: 'testimonials', type: 'testimonials', label: 'Customer Testimonials', enabled: true, sortOrder: 10,
      title: 'Loved by Creators', subtitle: 'Real feedback from real customers',
      description: '', maxProducts: null, backgroundImage: '', buttonText: '', buttonUrl: '',
    },
    {
      key: 'newsletter', type: 'newsletter', label: 'Newsletter Block', enabled: true, sortOrder: 11,
      title: 'Never Miss a Drop', subtitle: 'New templates, freebies & deals in your inbox',
      description: '', maxProducts: null, backgroundImage: '', buttonText: 'Subscribe', buttonUrl: '',
    },
    {
      key: 'promotion_blocks', type: 'promotion', label: 'Promotion Blocks', enabled: false, sortOrder: 12,
      title: 'Limited-Time Offer', subtitle: 'Save on select bundles this month',
      description: '', maxProducts: null, backgroundImage: img.font, buttonText: 'Shop the Sale', buttonUrl: '/shop?search=sale',
    },
  ],
};

// Header CMS — top-of-site chrome the storefront Header component will
// eventually read from: bars above the nav, the nav behavior itself, and
// the buttons on the right side of the bar.
export const seedHeaderCms = {
  logo: '',
  stickyHeader: true,
  megaMenuEnabled: true,
  searchPlaceholder: 'Search for anything…',
  topBar: {
    enabled: false,
    text: 'Free instant delivery on every digital order',
    linkText: '',
    linkUrl: '',
  },
  announcementBar: {
    enabled: false,
    text: '🎉 Summer Sale — up to 40% off select bundles',
    linkText: 'Shop Now',
    linkUrl: '/shop?search=sale',
    backgroundColor: '#7C3AED',
  },
  becomeSellerButton: {
    enabled: true,
    text: 'Become a Seller',
    url: '/become-a-seller',
  },
  headerButtons: [
    { id: 'hb-1', label: 'Help Center', url: '/contact', openInNewTab: false },
  ],
};

// Footer CMS — the parts of the Footer component that are copy/branding
// rather than link structure. Link columns themselves (Marketplace,
// Company, Support, Legal) are managed as Navigation Menus and referenced
// here by menu key, so the same menu builder powers header and footer.
export const seedFooterCms = {
  logo: '',
  description: 'A secure marketplace for digital accounts, domains, websites, SaaS, source code, and tools — with escrow protection and verified sellers.',
  tagline: 'Secure payments · Instant delivery · 30-day guarantee',
  copyrightText: '© {year} ApnaStore. All rights reserved.',
  socialLinks: [
    { id: 'soc-1', platform: 'Instagram', url: '#' },
    { id: 'soc-2', platform: 'Twitter', url: '#' },
    { id: 'soc-3', platform: 'Github', url: '#' },
    { id: 'soc-4', platform: 'Youtube', url: '#' },
  ],
  paymentIcons: [
    { id: 'pay-1', name: 'Visa', enabled: true },
    { id: 'pay-2', name: 'Mastercard', enabled: true },
    { id: 'pay-3', name: 'PayPal', enabled: true },
    { id: 'pay-4', name: 'Stripe', enabled: false },
    { id: 'pay-5', name: 'Apple Pay', enabled: false },
  ],
  newsletter: {
    enabled: true,
    title: 'Newsletter',
    description: 'New drops, deals, and creator spotlights — no spam.',
    placeholder: 'Your email',
    buttonLabel: 'Subscribe',
  },
  columnMenuKeys: {
    marketplace: 'footer-marketplace',
    company: 'footer-company',
    support: 'footer-support',
    legal: 'footer-legal',
  },
};

// Navigation Menus — the Menu Builder's data. Each menu is a flat list of
// items with `parentId` for one level of nesting (dropdown/sub-menu) and
// `sortOrder` for manual ordering within a parent. `location` is a hint
// for where a menu is intended to be used (Header / Footer / Custom);
// `key` is the stable identifier other CMS modules (e.g. Footer CMS
// columnMenuKeys) reference so swapping a menu's items never breaks the
// reference.
export const seedNavMenus = [
  {
    id: 'menu-header-nav', key: 'header-navigation', name: 'Header Navigation', location: 'Header',
    items: [
      { id: 'hn-1', label: 'Shop', url: '/shop', icon: '', openInNewTab: false, parentId: null, sortOrder: 1 },
      { id: 'hn-2', label: 'Categories', url: '/categories', icon: '', openInNewTab: false, parentId: null, sortOrder: 2 },
      { id: 'hn-3', label: 'Categories', url: '/categories', icon: '', openInNewTab: false, parentId: null, sortOrder: 3 },
      { id: 'hn-4', label: 'Blog', url: '/blog', icon: '', openInNewTab: false, parentId: null, sortOrder: 4 },
    ],
  },
  {
    id: 'menu-footer-marketplace', key: 'footer-marketplace', name: 'Footer — Marketplace', location: 'Footer',
    items: [
      { id: 'fm-1', label: 'Shop All', url: '/shop', icon: '', openInNewTab: false, parentId: null, sortOrder: 1 },
      { id: 'fm-2', label: 'Categories', url: '/categories', icon: '', openInNewTab: false, parentId: null, sortOrder: 2 },
      { id: 'fm-3', label: 'Categories', url: '/categories', icon: '', openInNewTab: false, parentId: null, sortOrder: 3 },
      { id: 'fm-4', label: 'Best Sellers', url: '/shop?sort=top-rated', icon: '', openInNewTab: false, parentId: null, sortOrder: 4 },
      { id: 'fm-5', label: 'Become a Seller', url: '/become-a-seller', icon: '', openInNewTab: false, parentId: null, sortOrder: 5 },
    ],
  },
  {
    id: 'menu-footer-company', key: 'footer-company', name: 'Footer — Company', location: 'Footer',
    items: [
      { id: 'fc-1', label: 'About', url: '/about', icon: '', openInNewTab: false, parentId: null, sortOrder: 1 },
      { id: 'fc-2', label: 'Blog', url: '/blog', icon: '', openInNewTab: false, parentId: null, sortOrder: 2 },
      { id: 'fc-3', label: 'Contact', url: '/contact', icon: '', openInNewTab: false, parentId: null, sortOrder: 3 },
      { id: 'fc-4', label: 'Careers', url: '/contact', icon: '', openInNewTab: false, parentId: null, sortOrder: 4 },
      { id: 'fc-5', label: 'Affiliates', url: '/contact', icon: '', openInNewTab: false, parentId: null, sortOrder: 5 },
    ],
  },
  {
    id: 'menu-footer-support', key: 'footer-support', name: 'Footer — Support', location: 'Footer',
    items: [
      { id: 'fs-1', label: 'FAQ', url: '/faq', icon: '', openInNewTab: false, parentId: null, sortOrder: 1 },
      { id: 'fs-2', label: 'Licensing', url: '/terms', icon: '', openInNewTab: false, parentId: null, sortOrder: 2 },
      { id: 'fs-3', label: 'Wallet', url: '/wallet', icon: '', openInNewTab: false, parentId: null, sortOrder: 3 },
      { id: 'fs-4', label: 'Order History', url: '/orders', icon: '', openInNewTab: false, parentId: null, sortOrder: 4 },
      { id: 'fs-5', label: 'Help Center', url: '/contact', icon: '', openInNewTab: false, parentId: null, sortOrder: 5 },
    ],
  },
  {
    id: 'menu-footer-legal', key: 'footer-legal', name: 'Footer — Legal', location: 'Footer',
    items: [
      { id: 'fl-1', label: 'Privacy Policy', url: '/privacy', icon: '', openInNewTab: false, parentId: null, sortOrder: 1 },
      { id: 'fl-2', label: 'Terms & Conditions', url: '/terms', icon: '', openInNewTab: false, parentId: null, sortOrder: 2 },
      { id: 'fl-3', label: 'Refund Policy', url: '/refund-policy', icon: '', openInNewTab: false, parentId: null, sortOrder: 3 },
      { id: 'fl-4', label: 'Cookies', url: '/privacy', icon: '', openInNewTab: false, parentId: null, sortOrder: 4 },
      { id: 'fl-5', label: 'DMCA', url: '/terms', icon: '', openInNewTab: false, parentId: null, sortOrder: 5 },
    ],
  },
];

// Hero Slider — homepage hero carousel slides. Distinct from the
// Homepage CMS's single "hero" section entry: when the hero section is
// enabled, it rotates through these slides.
export const seedHeroSlides = [
  {
    id: 'slide-1', title: 'Digital assets for creators who ship', subtitle: 'Handpicked templates, mockups & fonts',
    description: 'Instant downloads from vetted independent creators worldwide.',
    backgroundImage: img.wall, buttonText: 'Explore the Shop', buttonUrl: '/shop', status: 'active', sortOrder: 1,
  },
  {
    id: 'slide-2', title: 'New: Botanical Digital Assets', subtitle: 'Fresh from our top-rated sellers',
    description: 'Nature-inspired vectors, patterns, and prints.',
    backgroundImage: img.vector, buttonText: 'Shop Nature Assets', buttonUrl: '/shop?search=Nature', status: 'active', sortOrder: 2,
  },
  {
    id: 'slide-3', title: 'Summer Sale — Up to 40% Off', subtitle: 'Limited time on select bundles',
    description: '',
    backgroundImage: img.font, buttonText: 'Shop the Sale', buttonUrl: '/shop?search=sale', status: 'draft', sortOrder: 3,
  },
];

// Static Pages — the fixed legal/informational pages every marketplace
// needs. Content is plain text today (RichTextEditorPlaceholder — same
// component the Blog CMS uses), swapped for a real editor later with no
// change to this shape.
export const seedStaticPages = [
  { id: 'page-about', title: 'About Us', slug: 'about', content: 'ApnaStore connects buyers and verified sellers for digital accounts, domains, SaaS, source code, and tools.', featuredImage: '', seoTitle: 'About Us | ApnaStore', metaDescription: 'Learn about ApnaStore, a secure digital marketplace.', ogImage: '', status: 'published' },
  { id: 'page-contact', title: 'Contact', slug: 'contact', content: 'Reach out to our support team any time — we typically reply within one business day.', featuredImage: '', seoTitle: 'Contact Us | ApnaStore', metaDescription: 'Get in touch with the ApnaStore team.', ogImage: '', status: 'published' },
  { id: 'page-privacy', title: 'Privacy Policy', slug: 'privacy', content: 'This policy explains what information we collect and how we use it.', featuredImage: '', seoTitle: 'Privacy Policy | ApnaStore', metaDescription: 'Read the ApnaStore privacy policy.', ogImage: '', status: 'published' },
  { id: 'page-terms', title: 'Terms & Conditions', slug: 'terms', content: 'These terms govern your use of ApnaStore and the licenses attached to purchased products.', featuredImage: '', seoTitle: 'Terms & Conditions | ApnaStore', metaDescription: 'Read the ApnaStore terms and conditions.', ogImage: '', status: 'published' },
  { id: 'page-refund', title: 'Refund Policy', slug: 'refund-policy', content: 'Digital products are non-refundable once downloaded, with exceptions outlined below.', featuredImage: '', seoTitle: 'Refund Policy | ApnaStore', metaDescription: 'Read the ApnaStore refund policy for digital products.', ogImage: '', status: 'published' },
  { id: 'page-cookies', title: 'Cookie Policy', slug: 'cookie-policy', content: 'We use cookies to keep you signed in and to understand how the site is used.', featuredImage: '', seoTitle: 'Cookie Policy | ApnaStore', metaDescription: 'Learn how ApnaStore uses cookies.', ogImage: '', status: 'draft' },
  { id: 'page-license', title: 'License Policy', slug: 'license-policy', content: 'Every product on ApnaStore is sold under a Personal, Commercial, or Extended license — see what each allows.', featuredImage: '', seoTitle: 'License Policy | ApnaStore', metaDescription: 'Understand ApnaStore product licensing terms.', ogImage: '', status: 'published' },
  { id: 'page-shipping', title: 'Shipping Policy', slug: 'shipping-policy', content: 'Digital products deliver instantly. For the rare physical item, see delivery estimates below.', featuredImage: '', seoTitle: 'Shipping Policy | ApnaStore', metaDescription: 'Delivery details for digital and physical orders on ApnaStore.', ogImage: '', status: 'draft' },
];

// FAQ — grouped questions shown on the /faq storefront page.
export const seedFaqCategories = [
  { id: 'faqcat-orders', name: 'Orders & Downloads', slug: 'orders-downloads', sortOrder: 1 },
  { id: 'faqcat-licensing', name: 'Licensing', slug: 'licensing', sortOrder: 2 },
  { id: 'faqcat-sellers', name: 'Selling on ApnaStore', slug: 'selling', sortOrder: 3 },
  { id: 'faqcat-account', name: 'Account & Billing', slug: 'account-billing', sortOrder: 4 },
];

export const seedFaqs = [
  { id: 'faq-1', categoryId: 'faqcat-orders', question: 'When do I get access to my download?', answer: 'Immediately after payment confirms — from your Orders page or the confirmation email.', sortOrder: 1, status: 'published' },
  { id: 'faq-2', categoryId: 'faqcat-orders', question: 'Can I re-download a purchase later?', answer: 'Yes, every past purchase stays available from your account\u2019s Downloads tab.', sortOrder: 2, status: 'published' },
  { id: 'faq-3', categoryId: 'faqcat-licensing', question: 'What\u2019s the difference between Personal and Commercial licenses?', answer: 'Personal covers non-commercial personal use; Commercial allows use in client and for-profit work. See each product\u2019s license tab for specifics.', sortOrder: 1, status: 'published' },
  { id: 'faq-4', categoryId: 'faqcat-licensing', question: 'Can I resell a product I purchased?', answer: 'No — reselling or redistributing the source files themselves is not permitted under any license tier.', sortOrder: 2, status: 'published' },
  { id: 'faq-5', categoryId: 'faqcat-sellers', question: 'How do I become a seller?', answer: 'Apply from the Become a Seller page — approval typically takes 1-2 business days.', sortOrder: 1, status: 'published' },
  { id: 'faq-6', categoryId: 'faqcat-account', question: 'How do I update my billing details?', answer: 'Go to Account → Payment Methods to add or remove a card.', sortOrder: 1, status: 'draft' },
];

// Testimonials — customer quotes shown in the homepage testimonials
// section (and anywhere else it's reused).
export const seedTestimonials = [
  { id: 'test-1', customerName: 'Ava Thompson', photo: '', rating: 5, review: 'The license terms were crystal clear and the files were perfectly organized. Exactly what I needed for a client project.', status: 'published' },
  { id: 'test-2', customerName: 'Marco Ruiz', photo: '', rating: 5, review: 'Found a font pairing I now use across my whole brand. Instant download, no fuss.', status: 'published' },
  { id: 'test-3', customerName: 'Priya Nair', photo: '', rating: 4, review: 'Great selection of mockups — wish there were a few more color variants, but overall very happy.', status: 'published' },
  { id: 'test-4', customerName: 'Jonas Weber', photo: '', rating: 5, review: 'Support answered a licensing question within the hour. Will buy again.', status: 'draft' },
];

// Newsletter CMS — global appearance settings for the newsletter capture
// block wherever it's shown (homepage section, footer, popup). Homepage
// CMS and Footer CMS each control whether their own instance is enabled;
// this singleton owns the shared look-and-feel and the confirmation copy.
export const seedNewsletterCms = {
  backgroundImage: '',
  successMessage: "You're subscribed — thanks for joining!",
  disclaimerText: 'No spam. Unsubscribe any time.',
};

// Popup Manager — site-wide popups. Fixed set of 4 popup types (one per
// spec), each independently enabled/scheduled/delayed.
export const seedPopups = [
  {
    id: 'popup-newsletter', type: 'newsletter', label: 'Newsletter Popup', enabled: true,
    image: '', headline: 'Get 10% off your first order', content: 'Join our list for new drops, deals, and creator spotlights.',
    buttonText: 'Subscribe', buttonUrl: '', delaySeconds: 8, scheduleStart: '', scheduleEnd: '',
  },
  {
    id: 'popup-discount', type: 'discount', label: 'Discount Popup', enabled: false,
    image: '', headline: 'Flash Sale — 20% Off', content: 'Use code FLASH20 at checkout. Ends soon.',
    buttonText: 'Shop the Sale', buttonUrl: '/shop?search=sale', delaySeconds: 5, scheduleStart: '2026-08-01T00:00:00.000Z', scheduleEnd: '2026-08-07T00:00:00.000Z',
  },
  {
    id: 'popup-announcement', type: 'announcement', label: 'Announcement Popup', enabled: false,
    image: '', headline: "Explore ApnaStore Categories", content: 'Browse accounts, domains, SaaS, source code, and more.',
    buttonText: 'Explore Categories', buttonUrl: '/categories', delaySeconds: 3, scheduleStart: '', scheduleEnd: '',
  },
  {
    id: 'popup-age', type: 'age_verification', label: 'Age Verification Popup', enabled: false,
    image: '', headline: 'Please confirm your age', content: 'Some content on ApnaStore may not be suitable for all ages.',
    buttonText: 'I am 18 or older', buttonUrl: '', delaySeconds: 0, scheduleStart: '', scheduleEnd: '',
  },
];

// SEO Manager — centralized SEO for page *types* that don't already have
// their own dedicated SEO fields elsewhere. Blog has its own defaults
// (see seedBlogSettings) and Static Pages each carry their own SEO block
// (see seedStaticPages), so those aren't duplicated here.
export const seedSeoEntries = [
  {
    id: 'seo-homepage', pageType: 'Homepage', metaTitle: 'ApnaStore — Secure Digital Marketplace', metaDescription: 'Buy and sell social accounts, domains, SaaS, source code, and digital tools with escrow protection.',
    keywords: 'digital assets, templates, mockups, fonts, marketplace', canonicalUrl: '/', ogTitle: '', ogDescription: '', ogImage: '', twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '', schemaType: 'WebSite',
  },
  {
    id: 'seo-shop', pageType: 'Products (Shop)', metaTitle: 'Shop All Digital Products | ApnaStore', metaDescription: 'Browse the full ApnaStore catalog of digital templates, mockups, fonts, and design assets.',
    keywords: 'shop, digital products, templates', canonicalUrl: '/shop', ogTitle: '', ogDescription: '', ogImage: '', twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '', schemaType: 'WebPage',
  },
  {
    id: 'seo-categories', pageType: 'Categories', metaTitle: 'Shop by Category | ApnaStore', metaDescription: 'Explore digital products organized by category.',
    keywords: 'categories, digital products', canonicalUrl: '/categories', ogTitle: '', ogDescription: '', ogImage: '', twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '', schemaType: 'WebPage',
  },
  {
    id: 'seo-categories', pageType: 'Categories', metaTitle: 'Marketplace Categories | ApnaStore', metaDescription: 'Browse ApnaStore categories for accounts, domains, SaaS, source code, and digital tools.',
    keywords: 'categories, marketplace', canonicalUrl: '/categories', ogTitle: '', ogDescription: '', ogImage: '', twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '', schemaType: 'WebPage',
  },
  {
    id: 'seo-seller-store', pageType: 'Seller Store', metaTitle: '{sellerName} — Seller on ApnaStore', metaDescription: "Shop {sellerName}'s digital products on ApnaStore.",
    keywords: 'seller, shop, digital products', canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '', twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '', schemaType: 'ProfilePage',
  },
];

// Email Templates — transactional/marketing emails. `body` is plain text
// today (same RichTextEditorPlaceholder pattern used elsewhere); `{tokens}`
// mark merge fields the future backend will substitute.
export const seedEmailTemplates = [
  { id: 'email-welcome', key: 'welcome', name: 'Welcome Email', subject: 'Welcome to ApnaStore, {customerName}!', body: "Hi {customerName},\n\nWelcome to ApnaStore — we're glad you're here. Start exploring templates, mockups, and fonts from independent creators.\n\nHappy shopping!", enabled: true },
  { id: 'email-order', key: 'order', name: 'Order Confirmation Email', subject: 'Your ApnaStore order {orderNumber} is confirmed', body: 'Hi {customerName},\n\nThanks for your order! Your download is ready in your account under Orders.\n\nOrder: {orderNumber}\nTotal: {orderTotal}', enabled: true },
  { id: 'email-refund', key: 'refund', name: 'Refund Email', subject: 'Your refund for order {orderNumber} has been processed', body: 'Hi {customerName},\n\nYour refund for order {orderNumber} has been processed and should appear in your account within 5-10 business days.', enabled: true },
  { id: 'email-seller-approval', key: 'seller_approval', name: 'Seller Approval Email', subject: "You're approved to sell on ApnaStore!", body: 'Hi {sellerName},\n\nCongratulations — your seller application has been approved. You can now list your first product from your Seller Dashboard.', enabled: true },
  { id: 'email-password-reset', key: 'password_reset', name: 'Password Reset Email', subject: 'Reset your ApnaStore password', body: 'Hi {customerName},\n\nClick the link below to reset your password. This link expires in 1 hour.\n\n{resetLink}', enabled: true },
  { id: 'email-newsletter', key: 'newsletter', name: 'Newsletter Email', subject: '{newsletterSubject}', body: 'Hi {customerName},\n\n{newsletterContent}', enabled: false },
];

// Global Settings — brand-level appearance and locale defaults. Distinct
// from the store-operational fields on the System → Settings page
// (store email/phone/address/tax), which stay as-is; this owns the
// visual identity fields the CMS spec calls for.
export const seedGlobalSettings = {
  siteName: 'ApnaStore',
  tagline: 'Digital assets for creators who ship',
  logo: '',
  favicon: '',
  primaryColor: '#7C3AED',
  secondaryColor: '#F97316',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  timezone: 'America/Los_Angeles',
  language: 'en',
  currency: 'USD',
  measurementUnit: 'in',
};

// Social Settings — the storefront's own social profile links (distinct
// from Footer CMS's socialLinks, which are the icons rendered inline in
// the footer; this is the canonical per-platform URL list other
// components — e.g. a future "follow us" block or schema markup — read
// from, so a platform is entered once).
export const seedSocialSettings = {
  facebook: '', instagram: 'https://instagram.com/apnastore', youtube: '', tiktok: '', pinterest: '', linkedin: '', x: 'https://x.com/apnastore',
};

// Contact Settings — company/contact info shown on the Contact page and
// used for schema.org LocalBusiness/Organization markup later.
export const seedContactSettings = {
  companyName: 'ApnaStore Inc.',
  office: 'Remote-first support team',
  address: '123 Market Street, Suite 400, San Francisco, CA',
  phone: '+1 555-010-0000',
  email: 'hello@apnastore.org',
  whatsapp: '',
  googleMapsUrl: '',
  formTitle: 'Send us a message',
  formDescription: 'Questions about an order, dispute, payout, or becoming a seller? Our team is here to help.',
  supportHours: 'Monday–Friday, 9am–6pm CST. We typically reply within one business day.',
  businessHours: [
    { id: 'bh-1', day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM' },
    { id: 'bh-2', day: 'Saturday', hours: '10:00 AM – 4:00 PM' },
    { id: 'bh-3', day: 'Sunday', hours: 'Closed' },
  ],
};
