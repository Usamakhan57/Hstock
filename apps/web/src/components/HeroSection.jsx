import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Search, Star, TrendingUp, Users, Download,
  BadgeCheck, ShieldCheck, Zap, Cloud, Layers,
} from 'lucide-react';
import {
  SiInstagram, SiFacebook, SiGmail, SiTiktok, SiTelegram, SiYoutube,
  SiX, SiPinterest, SiGoogle, SiDiscord, SiReddit,
  SiApple, SiThreads, SiWhatsapp, SiVk, SiNaver,
  SiSteam, SiEpicgames, SiSpotify, SiNetflix,
} from 'react-icons/si';
import { getHomepageCategories } from '../services/categoryRepository';
import { useStore } from '../context/StoreContext';

/* ------------------------------------------------------------------ */
/*  Motion presets                                                     */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.07, ease: 'easeOut' } }),
};

/* ------------------------------------------------------------------ */
/*  Content                                                             */
/* ------------------------------------------------------------------ */
// Illustrative marketplace-wide numbers surfaced inside the hero.
const STATS = [
  { icon: Layers, value: '570+', label: 'Products' },
  { icon: Users, value: '154+', label: 'Sellers' },
  { icon: Download, value: '3,622+', label: 'Orders' },
  { icon: Star, value: '24/7', label: 'Support' },
];

// Cross-section of what buyers find on the marketplace — powers the
// floating preview cards on desktop and the scroll showcase on mobile.
// These mirror real ApnaStore catalog products (see admin/api/seedData.js)
// rather than fictional placeholder items.
const FLOATING_ICONS = [
  { id: 'instagram', label: 'Instagram', icon: SiInstagram, size: 96, wrap: 'top-6 right-16', rotate: -8, delay: 0.1, duration: 6.2, z: 40, opacity: 1, scale: 1.02 },
  { id: 'facebook', label: 'Facebook', icon: SiFacebook, size: 88, wrap: 'top-20 right-28', rotate: 6, delay: 0.4, duration: 5.8, z: 30, opacity: 0.95, scale: 1 },
  { id: 'gmail', label: 'Gmail', icon: SiGmail, size: 84, wrap: 'top-36 right-8', rotate: -5, delay: 0.7, duration: 6.6, z: 35, opacity: 0.98, scale: 1.03 },
  { id: 'tiktok', label: 'TikTok', icon: SiTiktok, size: 90, wrap: 'top-16 left-[40%]', rotate: 12, delay: 0.3, duration: 6.9, z: 20, opacity: 0.9, scale: 0.98 },
  { id: 'telegram', label: 'Telegram', icon: SiTelegram, size: 82, wrap: 'top-[42%] right-[24%]', rotate: -6, delay: 0.5, duration: 5.9, z: 25, opacity: 0.95, scale: 1.01 },
  { id: 'youtube', label: 'YouTube', icon: SiYoutube, size: 100, wrap: 'top-[52%] right-10', rotate: 5, delay: 1.1, duration: 6.4, z: 35, opacity: 1, scale: 1.05 },
  { id: 'x', label: 'X', icon: SiX, size: 86, wrap: 'top-[62%] left-[42%]', rotate: -4, delay: 0.8, duration: 6.5, z: 22, opacity: 0.9, scale: 0.98 },
  { id: 'pinterest', label: 'Pinterest', icon: SiPinterest, size: 80, wrap: 'top-[72%] right-[10%]', rotate: 8, delay: 1.4, duration: 6.8, z: 18, opacity: 0.88, scale: 0.96 },
  { id: 'google', label: 'Google', icon: SiGoogle, size: 88, wrap: 'top-[80%] left-[34%]', rotate: -3, delay: 1.2, duration: 7.1, z: 20, opacity: 0.92, scale: 0.99 },
  { id: 'discord', label: 'Discord', icon: SiDiscord, size: 92, wrap: 'bottom-[12%] right-[18%]', rotate: 7, delay: 0.9, duration: 5.7, z: 28, opacity: 0.97, scale: 1.02 },
  { id: 'reddit', label: 'Reddit', icon: SiReddit, size: 86, wrap: 'bottom-24 left-[46%]', rotate: -6, delay: 1.3, duration: 6.3, z: 16, opacity: 0.86, scale: 0.97 },
  { id: 'apple', label: 'Apple', icon: SiApple, size: 88, wrap: 'bottom-20 left-16', rotate: 5, delay: 1.6, duration: 7.0, z: 14, opacity: 0.8, scale: 0.95 },
  { id: 'spotify', label: 'Spotify', icon: SiSpotify, size: 94, wrap: 'top-[12%] right-[10%]', rotate: -5, delay: 2.4, duration: 7.2, z: 36, opacity: 1, scale: 1.04 },
  { id: 'whatsapp', label: 'WhatsApp', icon: SiWhatsapp, size: 100, wrap: 'bottom-[28%] right-[6%]', rotate: 6, delay: 2.0, duration: 7.2, z: 36, opacity: 1, scale: 1.04 },
  { id: 'vk', label: 'VK', icon: SiVk, size: 82, wrap: 'bottom-[38%] left-[26%]', rotate: -6, delay: 2.6, duration: 6.8, z: 16, opacity: 0.87, scale: 0.95 },
  { id: 'naver', label: 'Naver', icon: SiNaver, size: 80, wrap: 'bottom-[10%] left-[26%]', rotate: 5, delay: 2.8, duration: 6.2, z: 14, opacity: 0.84, scale: 0.96 },
  { id: 'steam', label: 'Steam', icon: SiSteam, size: 90, wrap: 'top-[8%] left-[10%]', rotate: -4, delay: 3.0, duration: 6.6, z: 24, opacity: 0.95, scale: 1.0 },
  { id: 'epic-games', label: 'Epic Games', icon: SiEpicgames, size: 88, wrap: 'bottom-[16%] left-[18%]', rotate: 7, delay: 3.2, duration: 6.9, z: 18, opacity: 0.88, scale: 0.98 },
  { id: 'netflix', label: 'Netflix', icon: SiNetflix, size: 86, wrap: 'top-[34%] right-[18%]', rotate: 6, delay: 3.6, duration: 6.4, z: 22, opacity: 0.9, scale: 0.98 },
];

/* ------------------------------------------------------------------ */
/*  Small shared pieces                                                */
/* ------------------------------------------------------------------ */
const TrustBadge = ({ compact = false }) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={fadeUp}
    className={`inline-flex items-center gap-2.5 glass rounded-full pl-1.5 pr-4 py-1.5 soft-shadow ${compact ? 'text-[11px]' : 'text-xs sm:text-[13px]'}`}
  >
    <span className="flex -space-x-2" aria-hidden="true">
      {['#6C3BFF', '#8F63FF', '#FF4FD8', '#FFB020'].map((c) => (
        <span key={c} className="w-[1.375rem] h-[1.375rem] rounded-full border-2 border-white" style={{ background: c }} />
      ))}
    </span>
    <span className="font-semibold text-foreground/80">
      Trusted by <span className="text-foreground">50,000+</span> creators worldwide
    </span>
  </motion.div>
);

const HeroSearchBar = ({ className = '', size = 'lg' }) => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search');
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Search the marketplace"
      className={`flex items-center gap-1.5 sm:gap-2 bg-white rounded-full border border-border soft-shadow-lg ${size === 'lg' ? 'p-2 pl-5' : 'p-1.5 pl-4'} ${className}`}
    >
      <Search className="w-[1.125rem] h-[1.125rem] text-muted-foreground shrink-0" aria-hidden="true" />
      <label htmlFor="hero-search" className="sr-only">Search digital products</label>
      <input
        id="hero-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search accounts, domains, SaaS, source code…"
        className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-[15px] placeholder:text-muted-foreground/60"
      />
      <button
        type="submit"
        className="shrink-0 brand-gradient text-white text-xs sm:text-sm font-semibold px-4 sm:px-6 py-2.5 rounded-full hover:opacity-95 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Search
      </button>
    </form>
  );
};

const CategoryPills = ({ className = '', scrollable = false }) => {
  const { catalogVersion } = useStore();
  const pills = useMemo(() => getHomepageCategories().slice(0, 7), [catalogVersion]);
  return (
    <div className={`flex items-center gap-2 ${scrollable ? 'overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0' : 'flex-wrap'} ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground/80 shrink-0">Popular:</span>
      {pills.map((c) => (
        <Link
          key={c.id}
          to={`/category/${c.slug}`}
          className="inline-flex items-center gap-1.5 shrink-0 text-xs sm:text-[13px] font-semibold bg-white border border-border rounded-full px-3.5 py-1.5 hover:-translate-y-0.5 hover:soft-shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <c.icon className="w-3.5 h-3.5" style={{ color: c.color }} aria-hidden="true" />
          {c.name}
        </Link>
      ))}
    </div>
  );
};

const CTAButtons = ({ className = '', stacked = false, primaryTo = '/shop', secondaryTo = '/become-a-seller', primaryText = 'Explore Marketplace', secondaryText = 'Become a Seller' }) => (
  <div className={`flex ${stacked ? 'flex-col' : 'flex-wrap'} gap-3 ${className}`}>
    <Link
      to={primaryTo}
      className={`group inline-flex items-center justify-center gap-2 brand-gradient text-white font-semibold px-7 py-3.5 rounded-full soft-shadow-lg hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${stacked ? 'w-full' : ''}`}
    >
      {primaryText} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
    <Link
      to={secondaryTo}
      className={`inline-flex items-center justify-center gap-2 bg-white text-foreground font-semibold px-7 py-3.5 rounded-full border border-border hover:bg-secondary hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${stacked ? 'w-full' : ''}`}
    >
      {secondaryText}
    </Link>
  </div>
);

const TrustStrip = ({ className = '' }) => (
  <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${className}`}>
    {[[ShieldCheck, 'SSL Secured'], [Cloud, 'Protected by Cloudflare'], [Zap, 'Secure Crypto Payments'], [BadgeCheck, 'Buyer Protection Guarantee'], [Download, 'Instant Delivery']].map(([Icon, label]) => (
      <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
        <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        {label}
      </div>
    ))}
  </div>
);

const StatsRow = ({ stats, cols = 4, className = '' }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true }}
    variants={fadeUp}
    className={`glass rounded-3xl soft-shadow px-3 sm:px-6 py-4 sm:py-6 ${className}`}
  >
    <dl className={`grid ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'} divide-x divide-border/70 text-center`}>
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2">
          <span className="hidden sm:grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mb-0.5">
            <s.icon className="w-4 h-4" aria-hidden="true" />
          </span>
          <dt className="sr-only">{s.label}</dt>
          <dd>
            <span className="block text-base sm:text-xl font-extrabold brand-text">{s.value}</span>
            <span className="block text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  Floating product card (desktop, absolutely positioned + parallax)  */
/* ------------------------------------------------------------------ */
const FloatingIcon = ({ icon: Icon, card, parallax }) => (
  <div
    className={`absolute ${card.wrap}`}
    style={{
      zIndex: card.z,
      opacity: card.opacity,
      transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)`,
      transition: 'transform 0.35s ease-out',
    }}
  >
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96, rotate: card.rotate }}
      animate={{ opacity: 1, y: [0, -10, 0], scale: [1, 1.02, 1], rotate: card.rotate + 1 }}
      transition={{
        opacity: { duration: 0.6, delay: card.delay },
        scale: { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: card.delay },
        y: { duration: card.duration, repeat: Infinity, ease: 'easeInOut', delay: card.delay },
      }}
      whileHover={{ y: -8, scale: 1.08, boxShadow: '0 30px 80px rgba(0,0,0,0.18)' }}
      className="group rounded-[22px] border border-white/55 bg-white/75 backdrop-blur-[18px] shadow-[0_24px_65px_rgba(15,23,42,0.12)] flex items-center justify-center cursor-pointer"
      style={{ width: card.size, height: card.size }}
    >
      <Icon className="w-10 h-10 text-foreground" aria-hidden="true" />
    </motion.div>
  </div>
);

/** Desktop-only floating cluster with subtle mouse-parallax + perpetual float. */
const DesktopMarketplaceVisual = () => {
  const ref = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallax({ x: x * 11, y: y * 11 });
  }, []);
  const handleLeave = useCallback(() => setParallax({ x: 0, y: 0 }), []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative w-full h-[32rem] xl:h-[36rem]"
      aria-hidden="true"
    >
      {/* mesh glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-3xl" />
      </div>
      {/* dotted texture */}
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{ backgroundImage: 'radial-gradient(rgba(108,59,255,0.35) 1px, transparent 1.5px)', backgroundSize: '20px 20px' }}
      />
      {FLOATING_ICONS.map((card) => (
        <FloatingIcon key={card.id} icon={card.icon} card={card} parallax={parallax} />
      ))}
    </div>
  );
};

/** Mobile-only horizontal showcase — same catalog, entirely different composition. */
const MobileMarketplaceShowcase = ({ className = '' }) => {
  const mobileIcons = FLOATING_ICONS.slice(0, 6);
  return (
    <div className={`relative ${className} overflow-hidden`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(108,59,255,0.22),_transparent_45%)] pointer-events-none" />
      <div className="relative h-[16rem]">
        {mobileIcons.map((card) => (
          <FloatingIcon
            key={card.id}
            icon={card.icon}
            card={{ ...card, size: 72, wrap: card.wrap.replace(/(top|bottom|left|right)-\[?\d+%?\]?/g, (match) => {
              if (match.includes('right') || match.includes('left')) return match;
              return match;
            }) }}
            parallax={{ x: 0, y: 0 }}
          />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Hero                                                                */
/* ------------------------------------------------------------------ */
/**
 * Homepage hero — rebuilt from scratch as a premium digital-marketplace
 * landing moment (Creative Market / Envato / UI8 territory): big bold
 * two-line headline, in-hero marketplace search with category pills,
 * a powerful CTA pair, live marketplace stats, and a cluster of floating
 * product-preview cards with glassmorphism, mesh gradients and mouse
 * parallax. Mobile ships a fully dedicated composition, not a shrunk
 * desktop layout.
 */
const HeroSection = () => (
  <section className="mx-auto max-w-[90rem] px-3 sm:px-5 lg:px-8 pt-4 lg:pt-6" aria-label="Welcome to ApnaStore — the marketplace for premium digital products">
    <div className="relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-[#F3EEFF] via-[#FBF7FF] to-[#FFEFFA] border border-white/70 soft-shadow">
      {/* ambient mesh blobs */}
      <div className="absolute -top-40 -right-32 w-[42rem] h-[42rem] rounded-full brand-gradient opacity-20 blur-3xl animate-hero-blob" aria-hidden="true" />
      <div className="absolute top-52 -left-40 w-[30rem] h-[30rem] rounded-full bg-accent opacity-10 blur-3xl animate-hero-blob" style={{ animationDelay: '2s' }} aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-[24rem] h-[24rem] rounded-full bg-[#12B8E0] opacity-10 blur-3xl animate-hero-blob" style={{ animationDelay: '4s' }} aria-hidden="true" />

      {/* ============================= DESKTOP ============================= */}
      <div className="hidden lg:block relative px-10 xl:px-14 pt-14 pb-10">
        <div className="grid grid-cols-2 gap-14 items-center">
          {/* Left — copy, search, pills, CTA */}
          <div>
            <TrustBadge />

            <motion.h1
  initial="hidden"
  animate="show"
  custom={1}
  variants={fadeUp}
  className="mt-6 text-5xl xl:text-[3.75rem] font-black tracking-tight leading-[1.05]"
>
  <span className="brand-text">ApnaStore</span> — Trade Digital Assets Securely
</motion.h1>

<motion.p
  initial="hidden"
  animate="show"
  custom={2}
  variants={fadeUp}
  className="mt-5 text-lg text-muted-foreground max-w-lg leading-relaxed"
>
  Buy and sell social accounts, domains, SaaS, source code, and tools with escrow protection and verified sellers.
</motion.p>

<motion.div
  initial="hidden"
  animate="show"
  custom={3}
  variants={fadeUp}
  className="mt-7"
>
  <HeroSearchBar />
</motion.div>

<motion.div
  initial="hidden"
  animate="show"
  custom={4}
  variants={fadeUp}
  className="mt-4"
>
  <CategoryPills />
</motion.div>

<motion.div
  initial="hidden"
  animate="show"
  custom={5}
  variants={fadeUp}
  className="mt-8"
>
  <CTAButtons primaryTo="/categories" primaryText="Browse Products" secondaryTo="/become-a-seller" secondaryText="Start Selling" />
</motion.div>

<motion.div
  initial="hidden"
  animate="show"
  custom={6}
  variants={fadeUp}
>
  <TrustStrip className="mt-7" />
</motion.div>
   
          </div>

          {/* Right — floating product cluster */}
          <div className="hidden lg:block">
            <DesktopMarketplaceVisual />
          </div>
        </div>

        <StatsRow stats={STATS} cols={4} className="mt-12" />
      </div>

      {/* ============================= MOBILE ============================= */}
      <div className="lg:hidden relative px-4 sm:px-6 pt-8 pb-8">
        <TrustBadge compact />

        <motion.h1
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="mt-4 text-3xl sm:text-4xl font-black tracking-tight leading-[1.08]"
        >
          <span className="brand-text">ApnaStore</span> — Trade Digital Assets Securely
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="mt-3 text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-md"
        >
          Buy and sell social accounts, domains, SaaS, source code, and tools with escrow protection and verified sellers.
        </motion.p>

        <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="mt-5">
          <HeroSearchBar size="sm" />
        </motion.div>

        <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp} className="mt-3.5">
          <CategoryPills scrollable />
        </motion.div>

        <motion.div initial="hidden" animate="show" custom={5} variants={fadeUp} className="mt-6">
          <CTAButtons stacked className="sm:flex-row sm:[&>*]:w-auto" />
        </motion.div>

        <motion.div className="hidden" initial="hidden" animate="show" custom={6} variants={fadeUp}>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Trending on ApnaStore</p>
          <MobileMarketplaceShowcase />
        </motion.div>

        <StatsRow stats={STATS.slice(0, 3)} cols={3} className="mt-7" />
      </div>
    </div>
  </section>
);

export default HeroSection;
