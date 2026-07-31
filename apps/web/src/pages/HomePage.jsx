import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  BadgeCheck,
  Star,
  Quote,
  Instagram,
  Mail,
  Facebook,
  Layers,
  Youtube,
  Send,
  MessageCircle,
  Cpu,
  Code,
  Globe2,
  BookOpen,
  GraduationCap,
  Smartphone,
  Gamepad,
} from 'lucide-react';
import { FaReddit } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import HeroSection from '../components/HeroSection';
import Seo from '../components/Seo';
import { ProductGridSkeleton } from '../components/Skeletons';
import { getStorefrontSellers } from '../services/sellerRepository';
import { getStorefrontTestimonials } from '../services/testimonialRepository';
import { getStorefrontCollections } from '../services/collectionRepository';
import { productsApi } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { SITE } from '../constants';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06, ease: 'easeOut' } }),
};

const Section = ({ eyebrow, title, cta, ctaTo = '/shop', children }) => (
  <section className="mx-auto max-w-[90rem] px-5 lg:px-8 mt-24 md:mt-28">
    <div className="flex items-end justify-between gap-6 mb-9">
      <div>
        {eyebrow && (
          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/[0.08] px-3 py-1 rounded-full mb-3">
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl md:text-[2.5rem] font-extrabold tracking-tight leading-tight">{title}</h2>
      </div>
      {cta && (
        <Link to={ctaTo} className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all shrink-0 focus-visible:outline-none focus-visible:underline">
          {cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
    {children}
  </section>
);

const POPULAR_CATEGORIES = [
  { title: 'Instagram Accounts', icon: Instagram, query: 'Instagram Accounts' },
  { title: 'Gmail Accounts', icon: Mail, query: 'Gmail Accounts' },
  { title: 'Facebook Accounts', icon: Facebook, query: 'Facebook Accounts' },
  { title: 'TikTok Accounts', icon: Layers, query: 'TikTok Accounts' },
  { title: 'YouTube Accounts', icon: Youtube, query: 'YouTube Accounts' },
  { title: 'Telegram Accounts', icon: Send, query: 'Telegram Accounts' },
  { title: 'Discord Accounts', icon: MessageCircle, query: 'Discord Accounts' },
  { title: 'Reddit Accounts', icon: FaReddit, query: 'Reddit Accounts' },
  { title: 'AI Tools', icon: Cpu, query: 'AI Tools' },
  { title: 'Source Code', icon: Code, query: 'Source Code' },
  { title: 'SaaS', icon: Layers, query: 'SaaS' },
  { title: 'Websites', icon: Globe2, query: 'Websites' },
  { title: 'Domains', icon: Globe2, query: 'Domains' },
  { title: 'Templates', icon: Code, query: 'Templates' },
  { title: 'Courses', icon: GraduationCap, query: 'Courses' },
  { title: 'eBooks', icon: BookOpen, query: 'eBooks' },
  { title: 'Mobile Apps', icon: Smartphone, query: 'Mobile Apps' },
  { title: 'VPN', icon: ShieldCheck, query: 'VPN' },
  { title: 'Gaming Accounts', icon: Gamepad, query: 'Gaming Accounts' },
];

const STORE_STATS = [
  { value: 100, suffix: 'K+', label: 'Products' },
  { value: 15, suffix: 'K+', label: 'Sellers' },
  { value: 50, suffix: '+', label: 'Categories' },
  { value: 180, suffix: '+', label: 'Countries' },
];

const WHY_FEATURES = [
  { icon: ShieldCheck, title: 'Verified sellers', description: 'Buy from trusted creators with verified product quality and fast support.' },
  { icon: Zap, title: 'Instant delivery', description: 'Most listings deliver instantly after checkout for a frictionless purchase.' },
  { icon: BadgeCheck, title: 'Secure payments', description: 'Secure checkout and payment protection keep your orders safe.' },
  { icon: Star, title: 'Top-rated marketplace', description: 'A premium marketplace built for digital goods, creators, and small businesses.' },
];

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
    },
    {
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.url,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

const AnimatedCounter = ({ end, suffix = '' }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.round(end / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= end) {
        setValue(end);
        clearInterval(interval);
      } else {
        setValue(current);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [end]);

  return <span>{value.toLocaleString()}{suffix}</span>;
};

const HomePage = () => {
  const { catalogVersion } = useStore();
  const { data: popular, loading: popularLoading } = useFetch(() => productsApi.popular(10), []);
  const { data: featuredProducts, loading: featuredLoading } = useFetch(() => productsApi.featured(8), []);
  const { data: latestProducts, loading: latestLoading } = useFetch(() => productsApi.latest(10), []);
  const featuredStores = useMemo(() => getStorefrontSellers().slice(0, 6), [catalogVersion]);
  const collections = useMemo(() => getStorefrontCollections().slice(0, 6), [catalogVersion]);
  const testimonials = getStorefrontTestimonials().slice(0, 6);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const stored = window?.localStorage ? JSON.parse(localStorage.getItem('recentlyViewed') || '[]') : [];
    setRecentlyViewed(stored.slice(0, 6));
  }, []);

  return (
    <div className="min-h-screen">
      <Seo jsonLd={homeJsonLd} />
      <Header />

      <main id="main-content">
        <HeroSection />

        <Section eyebrow="Popular categories" title="Browse top digital categories" cta="View all" ctaTo="/categories">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
            {POPULAR_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.title}
                  to={`/shop?search=${encodeURIComponent(category.query)}`}
                  className="group flex flex-col gap-4 rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-3xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{category.title}</span>
                </Link>
              );
            })}
          </div>
        </Section>

        <Section eyebrow="Featured stores" title="Premium seller storefronts" cta="Browse all sellers" ctaTo="/sellers">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredStores.map((seller) => (
              <Link
                key={seller.slug}
                to={`/seller/${seller.slug}`}
                className="group block overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-3xl bg-primary/10 text-primary text-lg font-bold">{seller.initials}</div>
                  <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Verified</div>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">{seller.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{seller.specialty || 'High-quality digital products from a trusted creator.'}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-xs font-semibold text-foreground">{seller.productCount || 0} products</div>
                  <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-xs font-semibold text-foreground">{seller.rating?.toFixed(1) ?? '4.9'} ★ rating</div>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Visit store <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section eyebrow="New arrivals" title="Latest products" cta="View all products" ctaTo="/shop">
          {latestLoading ? (
            <ProductGridSkeleton count={10} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {(latestProducts || []).map((product) => <ProductCard key={product.id} p={product} />)}
            </div>
          )}
        </Section>

        <Section eyebrow="Trending now" title="Trending products" cta="Shop trending" ctaTo="/shop">
          {popularLoading ? (
            <ProductGridSkeleton count={10} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {(popular || []).slice(0, 10).map((product) => (
                <div key={product.id} className="relative">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-primary/95 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">Trending</span>
                  <ProductCard p={product} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section eyebrow="Hand-picked" title="Featured products" cta="Explore featured" ctaTo="/shop">
          {featuredLoading ? (
            <ProductGridSkeleton count={6} className="grid grid-cols-2 lg:grid-cols-3 gap-5" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(featuredProducts || []).slice(0, 6).map((product) => <ProductCard key={product.id} p={product} />)}
            </div>
          )}
        </Section>

        <Section eyebrow="Popular collections" title="Collections for every creator" cta="See all collections" ctaTo="/collections">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                to={`/shop?search=${encodeURIComponent(collection.title)}`}
                className="group relative overflow-hidden rounded-[2rem] p-7 text-white shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, rgba(108,59,255,0.95), rgba(255,79,216,0.9))' }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 text-white mb-5">
                  <BookOpen className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold">{collection.title}</h3>
                <p className="mt-3 text-sm text-white/85 leading-relaxed line-clamp-3">{collection.description || 'A premium curated collection for your next digital purchase.'}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white">
                  Explore <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <section className="mx-auto max-w-[90rem] px-5 lg:px-8 mt-24">
          <div className="grid gap-5 rounded-[2.5rem] bg-white border border-border soft-shadow p-10 lg:grid-cols-4 lg:p-12">
            {STORE_STATS.map((stat) => (
              <motion.div key={stat.label} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="rounded-3xl bg-secondary/70 p-6 text-center">
                <p className="text-4xl font-extrabold tracking-tight text-foreground"><AnimatedCounter end={stat.value} suffix={stat.suffix} /></p>
                <p className="mt-3 text-sm uppercase tracking-[0.28em] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <Section eyebrow="Why choose HStock" title="Built for a premium digital marketplace">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {WHY_FEATURES.map((feature) => (
              <motion.div key={feature.title} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="rounded-[2rem] border border-border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="grid h-12 w-12 place-items-center rounded-3xl bg-primary/10 text-primary mb-5"><feature.icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <section className="mx-auto max-w-[90rem] px-5 lg:px-8 mt-24" aria-label="Become a seller">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6C3BFF] via-[#8F63FF] to-[#FF4FD8] p-10 lg:p-16 text-white soft-shadow-lg">
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 10% 10%, rgba(255,255,255,0.35), transparent 40%)' }} aria-hidden="true" />
            <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">Become a Seller</p>
                <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight">Start Selling Digital Products Today</h2>
                <p className="mt-5 max-w-xl text-sm text-white/90 leading-relaxed">Launch your storefront on HStock and connect with tens of thousands of buyers for accounts, templates, code, and services.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/become-a-seller" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-foreground shadow-lg transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    Become Seller <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <Link to="/become-a-seller" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <span className="grid place-items-center h-12 w-12 rounded-3xl bg-white/15 text-white">SL</span>
                  <div>
                    <p className="font-semibold">Seller Labs</p>
                    <p className="text-xs text-white/80">Top rated seller with 1.8k sales</p>
                  </div>
                </div>
                <div className="mt-7 grid gap-4">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/70">Monthly revenue</p>
                    <p className="mt-2 text-2xl font-black">$24.3K</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/70">Live listings</p>
                    <p className="mt-2 text-2xl font-black">128</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Section eyebrow="Customer reviews" title="What buyers say" cta="Read more" ctaTo="/testimonials">
          <div className="-mx-5 px-5 overflow-x-auto no-scrollbar sm:-mx-8 sm:px-8 py-2">
            <div className="flex gap-5 min-w-[110%] snap-x snap-mandatory">
              {testimonials.map((t) => (
                <article key={t.name} className="snap-start min-w-[20rem] shrink-0 rounded-[2rem] border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <span>Review</span>
                    <span className="inline-flex items-center gap-1 text-primary"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />{t.rating.toFixed(1)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="grid place-items-center h-12 w-12 rounded-full bg-secondary text-primary font-bold">{t.initials}</div>
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
