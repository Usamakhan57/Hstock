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
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { PRODUCT_GRID_CLASS } from '../lib/productGrid';
import HeroSection from '../components/HeroSection';
import Seo from '../components/Seo';
import { ProductGridSkeleton } from '../components/Skeletons';
import { NetworkErrorState } from '../components/ErrorState';
import { getStorefrontSellers } from '../services/sellerRepository';
import { getHomepageCategories } from '../services/categoryRepository';
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

const STORE_STATS = [
  { value: 100, suffix: 'K+', label: 'Products' },
  { value: 15, suffix: 'K+', label: 'Sellers' },
  { value: 50, suffix: '+', label: 'Categories' },
  { value: 180, suffix: '+', label: 'Countries' },
];

const WHY_FEATURES = [
  { icon: ShieldCheck, title: 'Verified sellers', description: 'Shop from vetted sellers with clear listing standards and responsive support.' },
  { icon: Zap, title: 'Fast delivery', description: 'Most digital listings unlock right after payment so you can start using them immediately.' },
  { icon: BadgeCheck, title: 'Escrow protection', description: 'Payments stay protected until delivery is confirmed — safer for buyers and sellers.' },
  { icon: Star, title: 'Built for digital commerce', description: 'Accounts, domains, SaaS, source code, and tools in one secure marketplace.' },
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

const ProductSection = ({ eyebrow, title, cta, ctaTo, loading, error, retry, products }) => {
  if (!loading && !error && (!products || products.length === 0)) return null;

  return (
    <Section eyebrow={eyebrow} title={title} cta={cta} ctaTo={ctaTo}>
      {loading ? (
        <ProductGridSkeleton count={12} className={PRODUCT_GRID_CLASS} />
      ) : error ? (
        <NetworkErrorState onRetry={retry} message="We couldn't load products right now. Please try again." />
      ) : (
        <div className={PRODUCT_GRID_CLASS}>
          {products.map((product) => (
            <ProductCard key={product.id} p={product} />
          ))}
        </div>
      )}
    </Section>
  );
};

const HomePage = () => {
  const { catalogVersion } = useStore();
  const { data: popular, loading: popularLoading, error: popularError, retry: retryPopular } = useFetch(() => productsApi.popular(10), []);
  const { data: featuredProducts, loading: featuredLoading, error: featuredError, retry: retryFeatured } = useFetch(() => productsApi.featured(8), []);
  const { data: latestProducts, loading: latestLoading, error: latestError, retry: retryLatest } = useFetch(() => productsApi.latest(10), []);
  const featuredStores = useMemo(() => getStorefrontSellers().slice(0, 6), [catalogVersion]);
  const popularCategories = useMemo(() => getHomepageCategories(), [catalogVersion]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('pm_recently_viewed') || localStorage.getItem('recentlyViewed') || '[]');
      setRecentlyViewed(Array.isArray(stored) ? stored.slice(0, 6) : []);
    } catch {
      setRecentlyViewed([]);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Seo jsonLd={homeJsonLd} />
      <Header />

      <main id="main-content">
        <HeroSection />

        {popularCategories.length > 0 && (
          <Section eyebrow="Marketplace services" title="Browse digital services" cta="View all" ctaTo="/categories">
            {/* Mobile: horizontal scroll. Tablet/Desktop: responsive multi-column grid. */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 sm:gap-4">
              {popularCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.id || category.slug}
                    to={`/category/${category.slug}`}
                    className="group flex w-[9.5rem] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg sm:w-auto sm:gap-4 sm:rounded-[1.75rem] sm:p-5"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 sm:h-14 sm:w-14 sm:rounded-3xl">
                      {category.image ? (
                        <img src={category.image} alt="" className="h-full w-full rounded-2xl object-cover sm:rounded-3xl" />
                      ) : (
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{category.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {Number(category.productCount || 0).toLocaleString()} products
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {featuredStores.length > 0 && (
          <Section eyebrow="Featured stores" title="Premium seller storefronts" cta="Browse marketplace" ctaTo="/shop">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredStores.map((seller) => (
                <Link
                  key={seller.slug}
                  to={`/seller/${seller.slug}`}
                  className="group block overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-3xl bg-primary/10 text-primary text-lg font-bold">{seller.initials}</div>
                    {seller.verified && (
                      <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Verified</div>
                    )}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">{seller.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{seller.specialty || seller.bio || 'Trusted digital listings from a verified ApnaStore seller.'}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-xs font-semibold text-foreground">{seller.productCount || 0} products</div>
                    <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-xs font-semibold text-foreground">
                      {seller.rating != null ? `${Number(seller.rating).toFixed(1)} ★ rating` : 'New seller'}
                    </div>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                    Visit store <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}

        <ProductSection
          eyebrow="Recently added"
          title="Latest products"
          cta="View all products"
          ctaTo="/shop?sort=newest"
          loading={latestLoading}
          error={latestError}
          retry={retryLatest}
          products={latestProducts || []}
        />

        <ProductSection
          eyebrow="Trending now"
          title="Trending products"
          cta="Shop trending"
          ctaTo="/shop?sort=most-popular"
          loading={popularLoading}
          error={popularError}
          retry={retryPopular}
          products={(popular || []).slice(0, 10)}
        />

        <ProductSection
          eyebrow="Most popular"
          title="Popular products"
          cta="Browse popular"
          ctaTo="/shop?sort=most-popular"
          loading={popularLoading}
          error={popularError}
          retry={retryPopular}
          products={(popular || []).slice(0, 8)}
        />

        <ProductSection
          eyebrow="Hand-picked"
          title="Featured products"
          cta="Explore featured"
          ctaTo="/shop"
          loading={featuredLoading}
          error={featuredError}
          retry={retryFeatured}
          products={(featuredProducts || []).slice(0, 6)}
        />

        {recentlyViewed.length > 0 && (
          <Section eyebrow="Continue browsing" title="Recently viewed" cta="View shop" ctaTo="/shop">
            <div className={PRODUCT_GRID_CLASS}>
              {recentlyViewed.map((product) => (
                <ProductCard key={product.id} p={product} />
              ))}
            </div>
          </Section>
        )}

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

        <Section eyebrow="Why choose ApnaStore" title="A safer way to buy and sell digital assets">
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
                <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight">Start Selling on ApnaStore</h2>
                <p className="mt-5 max-w-xl text-sm text-white/90 leading-relaxed">Open your storefront and list accounts, domains, websites, SaaS, source code, and tools for buyers who expect secure checkout.</p>
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
                  <span className="grid place-items-center h-12 w-12 rounded-3xl bg-white/15 text-white">AS</span>
                  <div>
                    <p className="font-semibold">ApnaStore Sellers</p>
                    <p className="text-xs text-white/80">Grow with escrow-backed digital commerce</p>
                  </div>
                </div>
                <div className="mt-7 grid gap-4">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/70">Secure escrow</p>
                    <p className="mt-2 text-2xl font-black">Built-in</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/70">Instant listings</p>
                    <p className="mt-2 text-2xl font-black">Go live fast</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
