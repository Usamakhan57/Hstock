/**
 * Default CMS payloads seeded into Mongo on first read.
 * Storefront must never fall back to hardcoded page copy — only these DB defaults.
 */

export const CMS_KEYS = Object.freeze({
  POPULAR_TAGS: 'popular_tags',
  CONTACT: 'contact',
  HOMEPAGE: 'homepage',
  HEADER: 'header',
  FOOTER: 'footer',
  GLOBAL: 'global',
  SOCIAL: 'social',
  NEWSLETTER: 'newsletter',
  FAQ_CATEGORIES: 'faq_categories',
  FAQS: 'faqs',
  STATIC_PAGES: 'static_pages',
  HERO_SLIDES: 'hero_slides',
  POPUPS: 'popups',
  SEO: 'seo',
  TESTIMONIALS: 'testimonials',
  NAV_MENUS: 'nav_menus',
  EMAIL_TEMPLATES: 'email_templates',
});

export const DEFAULT_POPULAR_TAGS = Object.freeze({
  tags: [
    { id: 'pt-gmail', label: 'Gmail Accounts', url: '/shop?search=Gmail', enabled: true, sortOrder: 1 },
    { id: 'pt-instagram', label: 'Instagram Accounts', url: '/shop?search=Instagram', enabled: true, sortOrder: 2 },
    { id: 'pt-yahoo', label: 'Yahoo Accounts', url: '/shop?search=Yahoo', enabled: true, sortOrder: 3 },
    { id: 'pt-facebook', label: 'Facebook Accounts', url: '/shop?search=Facebook', enabled: true, sortOrder: 4 },
    { id: 'pt-tiktok', label: 'TikTok Accounts', url: '/shop?search=TikTok', enabled: true, sortOrder: 5 },
    { id: 'pt-twitter', label: 'Twitter/X Accounts', url: '/shop?search=Twitter', enabled: true, sortOrder: 6 },
    { id: 'pt-discord', label: 'Discord Accounts', url: '/shop?search=Discord', enabled: true, sortOrder: 7 },
    { id: 'pt-business-email', label: 'Business Email', url: '/shop?search=Business%20Email', enabled: true, sortOrder: 8 },
  ],
});

export const DEFAULT_CONTACT = Object.freeze({
  companyName: 'ApnaStore',
  office: 'Remote-first support team',
  address: '',
  phone: '',
  email: 'support@apnastore.org',
  whatsapp: '',
  googleMapsUrl: '',
  formTitle: 'Send us a message',
  formDescription: 'Questions about an order, dispute, payout, or becoming a seller? Our team is here to help.',
  supportHours: 'Monday–Friday, 9am–6pm CST. We typically reply within one business day.',
  businessHours: [
    { id: 'bh-1', day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM CST' },
    { id: 'bh-2', day: 'Saturday', hours: '10:00 AM – 4:00 PM CST' },
    { id: 'bh-3', day: 'Sunday', hours: 'Closed' },
  ],
});

export const DEFAULT_HOMEPAGE = Object.freeze({
  sections: [
    {
      key: 'hero', type: 'hero', label: 'Hero Section', enabled: true, sortOrder: 1,
      title: 'Digital assets for creators who ship', subtitle: 'Secure marketplace for accounts & tools',
      description: '', maxProducts: null, backgroundImage: '', buttonText: 'Explore the Shop', buttonUrl: '/shop',
    },
    {
      key: 'popular_tags', type: 'popular_tags', label: 'Popular Tags', enabled: true, sortOrder: 2,
      title: 'Popular', subtitle: 'Browse marketplace-relevant categories',
      description: '', maxProducts: 8, backgroundImage: '', buttonText: '', buttonUrl: '',
    },
    {
      key: 'featured_categories', type: 'categories', label: 'Featured Categories', enabled: true, sortOrder: 3,
      title: 'Shop by Category', subtitle: 'Find exactly what your project needs',
      description: '', maxProducts: 8, backgroundImage: '', buttonText: 'View All Categories', buttonUrl: '/categories',
    },
    {
      key: 'featured_products', type: 'products', label: 'Featured Products', enabled: true, sortOrder: 4,
      title: 'Featured', subtitle: "Editor's picks this week",
      description: '', maxProducts: 12, backgroundImage: '', buttonText: 'Shop Featured', buttonUrl: '/shop?featured=true',
    },
    {
      key: 'popular_sellers', type: 'sellers', label: 'Popular Sellers', enabled: true, sortOrder: 5,
      title: 'Popular Sellers', subtitle: 'Top-rated shops on ApnaStore',
      description: '', maxProducts: 8, backgroundImage: '', buttonText: 'Browse All Sellers', buttonUrl: '/sellers',
    },
    {
      key: 'testimonials', type: 'testimonials', label: 'Customer Testimonials', enabled: true, sortOrder: 6,
      title: 'Loved by Creators', subtitle: 'Real feedback from real customers',
      description: '', maxProducts: null, backgroundImage: '', buttonText: '', buttonUrl: '',
    },
    {
      key: 'newsletter', type: 'newsletter', label: 'Newsletter Block', enabled: true, sortOrder: 7,
      title: 'Never Miss a Drop', subtitle: 'New listings, deals & marketplace updates',
      description: '', maxProducts: null, backgroundImage: '', buttonText: 'Subscribe', buttonUrl: '',
    },
  ],
});

export const DEFAULT_HEADER = Object.freeze({
  logo: '',
  stickyHeader: true,
  megaMenuEnabled: true,
  searchPlaceholder: 'Search for anything…',
  topBar: { enabled: false, text: '', linkText: '', linkUrl: '' },
  announcementBar: {
    enabled: false,
    text: '',
    linkText: '',
    linkUrl: '',
    backgroundColor: '#7C3AED',
  },
  becomeSellerButton: { enabled: true, text: 'Become a Seller', url: '/become-a-seller' },
  headerButtons: [],
});

export const DEFAULT_FOOTER = Object.freeze({
  logo: '',
  description: 'A secure marketplace for digital accounts, domains, websites, SaaS, source code, and tools — with escrow protection and verified sellers.',
  tagline: 'Secure payments · Instant delivery · Escrow protection',
  copyrightText: '© {year} ApnaStore. All rights reserved.',
  socialLinks: [
    { id: 'soc-1', platform: 'Instagram', url: '' },
    { id: 'soc-2', platform: 'Twitter', url: '' },
    { id: 'soc-3', platform: 'Github', url: '' },
    { id: 'soc-4', platform: 'Youtube', url: '' },
  ],
  paymentIcons: [],
  newsletter: {
    enabled: true,
    title: 'Newsletter',
    description: 'New drops, deals, and creator spotlights — no spam.',
    placeholder: 'Your email',
    buttonLabel: 'Subscribe',
  },
  columns: [
    {
      title: 'Marketplace',
      links: [
        { name: 'Shop All', to: '/shop' },
        { name: 'Categories', to: '/categories' },
        { name: 'Best Sellers', to: '/shop?sort=Most%20Popular' },
        { name: 'Become a Seller', to: '/become-a-seller' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', to: '/about' },
        { name: 'Blog', to: '/blog' },
        { name: 'Contact', to: '/contact' },
        { name: 'Seller Hub', to: '/seller' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'FAQ', to: '/faq' },
        { name: 'Buyer Guide', to: '/buyer-guide' },
        { name: 'Seller Guide', to: '/seller-guide' },
        { name: 'Help Center', to: '/support' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', to: '/privacy' },
        { name: 'Terms & Conditions', to: '/terms' },
        { name: 'Refund Policy', to: '/refund-policy' },
        { name: 'Cookie Policy', to: '/cookie-policy' },
      ],
    },
  ],
});

export const DEFAULT_GLOBAL = Object.freeze({
  siteName: 'ApnaStore',
  tagline: 'Secure digital marketplace',
  logo: '',
  favicon: '',
  primaryColor: '#7C3AED',
  secondaryColor: '#F97316',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  timezone: 'America/Chicago',
  language: 'en',
  currency: 'USD',
  measurementUnit: 'in',
});

export const DEFAULT_SOCIAL = Object.freeze({
  facebook: '',
  instagram: '',
  youtube: '',
  tiktok: '',
  pinterest: '',
  linkedin: '',
  x: '',
});

export const DEFAULT_NEWSLETTER = Object.freeze({
  backgroundImage: '',
  successMessage: "You're subscribed — thanks for joining!",
  disclaimerText: 'No spam. Unsubscribe any time.',
});

export const DEFAULT_FAQ_CATEGORIES = Object.freeze({
  items: [
    { id: 'faqcat-orders', name: 'Orders & Downloads', slug: 'orders-downloads', sortOrder: 1 },
    { id: 'faqcat-licensing', name: 'Licensing', slug: 'licensing', sortOrder: 2 },
    { id: 'faqcat-sellers', name: 'Selling on ApnaStore', slug: 'selling', sortOrder: 3 },
    { id: 'faqcat-account', name: 'Account & Billing', slug: 'account-billing', sortOrder: 4 },
  ],
});

export const DEFAULT_FAQS = Object.freeze({
  items: [
    { id: 'faq-1', categoryId: 'faqcat-orders', question: 'When do I get access to my download?', answer: 'Immediately after payment confirms — from your Orders page or the confirmation email.', sortOrder: 1, status: 'published' },
    { id: 'faq-2', categoryId: 'faqcat-orders', question: 'Can I re-download a purchase later?', answer: 'Yes, every past purchase stays available from your account’s Downloads tab.', sortOrder: 2, status: 'published' },
    { id: 'faq-3', categoryId: 'faqcat-licensing', question: 'What’s the difference between Personal and Commercial licenses?', answer: 'Personal covers non-commercial personal use; Commercial allows use in client and for-profit work. See each product’s license tab for specifics.', sortOrder: 1, status: 'published' },
    { id: 'faq-4', categoryId: 'faqcat-sellers', question: 'How do I become a seller?', answer: 'Apply from the Become a Seller page — approval typically takes 1-2 business days.', sortOrder: 1, status: 'published' },
  ],
});

export const DEFAULT_STATIC_PAGES = Object.freeze({
  items: [
    { id: 'page-about', title: 'About Us', slug: 'about', content: 'ApnaStore connects buyers and verified sellers for digital accounts, domains, SaaS, source code, and tools.', featuredImage: '', seoTitle: 'About Us | ApnaStore', metaDescription: 'Learn about ApnaStore, a secure digital marketplace.', ogImage: '', status: 'published' },
    { id: 'page-privacy', title: 'Privacy Policy', slug: 'privacy', content: 'This policy explains what information we collect and how we use it. Contact support@apnastore.org for privacy requests.', featuredImage: '', seoTitle: 'Privacy Policy | ApnaStore', metaDescription: 'Read the ApnaStore privacy policy.', ogImage: '', status: 'published' },
    { id: 'page-terms', title: 'Terms & Conditions', slug: 'terms', content: 'These terms govern your use of ApnaStore and the licenses attached to purchased products. Contact support@apnastore.org with questions.', featuredImage: '', seoTitle: 'Terms & Conditions | ApnaStore', metaDescription: 'Read the ApnaStore terms and conditions.', ogImage: '', status: 'published' },
    { id: 'page-refund', title: 'Refund Policy', slug: 'refund-policy', content: 'Digital products are non-refundable once delivered, with exceptions handled through disputes. Contact support@apnastore.org for help.', featuredImage: '', seoTitle: 'Refund Policy | ApnaStore', metaDescription: 'Read the ApnaStore refund policy for digital products.', ogImage: '', status: 'published' },
    { id: 'page-cookies', title: 'Cookie Policy', slug: 'cookie-policy', content: 'We use cookies to keep you signed in and to understand how the site is used.', featuredImage: '', seoTitle: 'Cookie Policy | ApnaStore', metaDescription: 'Learn how ApnaStore uses cookies.', ogImage: '', status: 'published' },
  ],
});

export const DEFAULT_HERO_SLIDES = Object.freeze({
  items: [
    {
      id: 'slide-1',
      title: 'Secure digital marketplace',
      subtitle: 'Accounts, domains, SaaS & tools',
      description: 'Escrow-protected purchases from verified sellers.',
      backgroundImage: '',
      buttonText: 'Explore the Shop',
      buttonUrl: '/shop',
      status: 'active',
      sortOrder: 1,
    },
  ],
});

export const DEFAULT_POPUPS = Object.freeze({
  items: [
    {
      id: 'popup-newsletter',
      type: 'newsletter',
      label: 'Newsletter Popup',
      enabled: false,
      image: '',
      headline: 'Get marketplace updates',
      content: 'Join our list for new drops and deals.',
      buttonText: 'Subscribe',
      buttonUrl: '',
      delaySeconds: 8,
      scheduleStart: '',
      scheduleEnd: '',
    },
  ],
});

export const DEFAULT_SEO = Object.freeze({
  items: [
    {
      id: 'seo-homepage',
      pageType: 'Homepage',
      metaTitle: 'ApnaStore — Secure Digital Marketplace',
      metaDescription: 'Buy and sell social accounts, domains, SaaS, source code, and digital tools with escrow protection.',
      keywords: 'digital marketplace, accounts, escrow',
      canonicalUrl: '/',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      schemaType: 'WebSite',
    },
    {
      id: 'seo-contact',
      pageType: 'Contact',
      metaTitle: 'Contact Us | ApnaStore',
      metaDescription: 'Contact ApnaStore support for orders, seller questions, disputes, and partnership inquiries.',
      keywords: 'contact, support',
      canonicalUrl: '/contact',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      schemaType: 'ContactPage',
    },
  ],
});

export const DEFAULT_TESTIMONIALS = Object.freeze({
  items: [
    { id: 'test-1', customerName: 'Ava Thompson', photo: '', rating: 5, review: 'Clear licenses and instant delivery. Exactly what I needed.', status: 'published' },
    { id: 'test-2', customerName: 'Marco Ruiz', photo: '', rating: 5, review: 'Escrow made the purchase feel safe. Will buy again.', status: 'published' },
  ],
});

export const DEFAULT_NAV_MENUS = Object.freeze({
  items: [],
});

export const DEFAULT_EMAIL_TEMPLATES = Object.freeze({
  items: [
    { id: 'email-welcome', key: 'welcome', name: 'Welcome Email', subject: 'Welcome to ApnaStore, {customerName}!', body: 'Hi {customerName},\n\nWelcome to ApnaStore.', enabled: true },
    { id: 'email-order', key: 'order', name: 'Order Confirmation Email', subject: 'Your ApnaStore order {orderNumber} is confirmed', body: 'Hi {customerName},\n\nYour order {orderNumber} is confirmed.', enabled: true },
  ],
});

export const CMS_DEFAULTS = Object.freeze({
  [CMS_KEYS.POPULAR_TAGS]: DEFAULT_POPULAR_TAGS,
  [CMS_KEYS.CONTACT]: DEFAULT_CONTACT,
  [CMS_KEYS.HOMEPAGE]: DEFAULT_HOMEPAGE,
  [CMS_KEYS.HEADER]: DEFAULT_HEADER,
  [CMS_KEYS.FOOTER]: DEFAULT_FOOTER,
  [CMS_KEYS.GLOBAL]: DEFAULT_GLOBAL,
  [CMS_KEYS.SOCIAL]: DEFAULT_SOCIAL,
  [CMS_KEYS.NEWSLETTER]: DEFAULT_NEWSLETTER,
  [CMS_KEYS.FAQ_CATEGORIES]: DEFAULT_FAQ_CATEGORIES,
  [CMS_KEYS.FAQS]: DEFAULT_FAQS,
  [CMS_KEYS.STATIC_PAGES]: DEFAULT_STATIC_PAGES,
  [CMS_KEYS.HERO_SLIDES]: DEFAULT_HERO_SLIDES,
  [CMS_KEYS.POPUPS]: DEFAULT_POPUPS,
  [CMS_KEYS.SEO]: DEFAULT_SEO,
  [CMS_KEYS.TESTIMONIALS]: DEFAULT_TESTIMONIALS,
  [CMS_KEYS.NAV_MENUS]: DEFAULT_NAV_MENUS,
  [CMS_KEYS.EMAIL_TEMPLATES]: DEFAULT_EMAIL_TEMPLATES,
});

export const CMS_KEY_LIST = Object.freeze(Object.keys(CMS_DEFAULTS));

export default {
  CMS_KEYS,
  CMS_DEFAULTS,
  CMS_KEY_LIST,
};
