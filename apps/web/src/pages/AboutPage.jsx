import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Heart, Quote, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { getStorefrontSellers } from '../services/sellerRepository';
import { fetchStorefrontTestimonials } from '../services/testimonialRepository';
import { fetchStaticPageBySlug } from '../services/staticPagesRepository';
import { subscribeCmsUpdates, CMS_KEYS } from '../services/cmsApi';
import { useCms } from '../hooks/useCms';

const values = [
  { icon: Sparkles, title: 'Quality listings', text: 'Every product is reviewed for clarity, delivery readiness, and marketplace standards before it goes live.' },
  { icon: ShieldCheck, title: 'Escrow protection', text: 'Payments stay protected until delivery is confirmed so buyers and sellers can trade with confidence.' },
  { icon: Zap, title: 'Fast digital delivery', text: 'Most listings unlock immediately after checkout — accounts, files, and assets when you need them.' },
  { icon: Heart, title: 'Seller-first economics', text: 'Transparent fees and reliable payouts help serious sellers grow sustainable digital businesses.' },
];

const AboutPage = () => {
  const [aboutPage, setAboutPage] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const { data: global } = useCms(CMS_KEYS.GLOBAL);
  const { data: homepage } = useCms(CMS_KEYS.HOMEPAGE);
  const stats = Array.isArray(homepage?.stats)
    ? homepage.stats.map((s) => ({ value: `${s.value}${s.suffix || ''}`, label: s.label }))
    : [];

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: aboutPage?.seoTitle || aboutPage?.title || `About ${global?.siteName || ''}`.trim(),
    url: global?.siteUrl ? `${global.siteUrl}/about` : '/about',
    description: aboutPage?.metaDescription || global?.slogan || global?.tagline || '',
    mainEntity: {
      '@type': 'Organization',
      name: global?.siteName || '',
      url: global?.siteUrl || '',
    },
  };

  const load = async () => {
    try {
      const [page, quotes] = await Promise.all([
        fetchStaticPageBySlug('about'),
        fetchStorefrontTestimonials(),
      ]);
      setAboutPage(page);
      setTestimonials(quotes);
    } catch {
      setAboutPage(null);
      setTestimonials([]);
    }
  };

  useEffect(() => {
    load();
    return subscribeCmsUpdates((detail) => {
      if (!detail?.key || detail.key === CMS_KEYS.STATIC_PAGES || detail.key === CMS_KEYS.TESTIMONIALS) {
        load();
      }
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Seo
        title={aboutPage?.seoTitle || 'About Us'}
        description={aboutPage?.metaDescription || global?.slogan || global?.tagline || ''}
        jsonLd={aboutJsonLd}
      />
      <Header />

      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10">
        <Breadcrumbs items={[{ name: 'About' }]} />

        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            <span className="brand-text">{global?.siteName || 'ApnaStore'}</span> — {aboutPage?.title || 'a marketplace built for digital commerce'}
          </h1>
          <p className="text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">
            {aboutPage?.content
              || global?.slogan
              || global?.tagline
              || ''}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-3xl border border-border soft-shadow p-6 text-center">
              <p className="text-3xl font-black brand-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-extrabold tracking-tight mb-8">What we care about</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-3xl border border-border p-6 flex gap-4">
                <span className="grid place-items-center w-12 h-12 rounded-2xl brand-gradient text-white shrink-0">
                  <v.icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold">{v.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24">
          <div className="flex items-end justify-between gap-6 mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">Meet a few of our sellers</h2>
            <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all shrink-0">
              Browse marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {getStorefrontSellers().slice(0, 6).map((a) => (
              <Link key={a.slug} to={`/seller/${a.slug}`} className="group bg-white rounded-3xl border border-border p-6 flex items-center gap-4 hover:soft-shadow transition-all">
                <span className="w-14 h-14 rounded-full brand-gradient text-white grid place-items-center text-sm font-bold shrink-0">{a.initials}</span>
                <div>
                  <h3 className="font-bold group-hover:text-primary transition-colors">{a.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.specialty} · {a.sales} sales</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-24 pb-24">
          <h2 className="text-3xl font-extrabold tracking-tight mb-8">What customers say</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.id || t.name} className="bg-white rounded-3xl border border-border p-6">
                <Quote className="w-6 h-6 text-primary/40 mb-3" />
                <p className="text-sm text-foreground/85 leading-relaxed">{t.text}</p>
                <div className="flex items-center gap-3 mt-5">
                  <span className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center text-xs font-bold">{t.initials}</span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-24 rounded-3xl brand-gradient p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Ready for your next digital asset?</h2>
          <p className="mt-3 text-white/85 max-w-md mx-auto">Shop verified listings with escrow protection — or open a seller storefront today.</p>
          <Link to="/shop" className="inline-flex items-center justify-center gap-2 mt-7 px-7 py-3.5 rounded-full bg-white text-foreground font-semibold hover:scale-[1.03] transition-transform">
            Explore ApnaStore <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
