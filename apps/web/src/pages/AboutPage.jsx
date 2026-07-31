import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Heart, Quote, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { getStorefrontSellers } from '../services/sellerRepository';
import { getStorefrontTestimonials } from '../services/testimonialRepository';

const stats = [
  { value: '12,000+', label: 'Digital Assets' },
  { value: '85,000+', label: 'Happy Customers' },
  { value: '150+', label: 'Independent Artists' },
  { value: '4.9/5', label: 'Average Rating' },
];

const values = [
  { icon: Sparkles, title: 'Hand-Picked Quality', text: 'Every product is reviewed before it goes live — no filler, no low-effort uploads.' },
  { icon: ShieldCheck, title: 'Clear Licensing', text: 'Personal, Commercial, and Extended tiers spelled out plainly so you always know what you can do.' },
  { icon: Zap, title: 'Instant Delivery', text: 'Downloads unlock the second checkout completes — no waiting on emails or approvals.' },
  { icon: Heart, title: 'Artist-First', text: 'Creators keep the majority of every sale, so the marketplace grows around real, sustainable work.' },
];

const AboutPage = () => (
  <div className="min-h-screen">
    <Seo title="About Us" description="HStock is a premium marketplace for digital art — learn about our mission, curation, and creator community." />
    <Header />

    <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-10">
        <Breadcrumbs items={[{ name: 'About' }]} />

      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">A marketplace built for <span className="brand-text">digital creators</span></h1>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          HStock started in 2019 as a small clipart shop and grew into a full marketplace for premium digital art — wall prints,
          planners, cliparts, templates, and more — made by independent artists around the world. We obsess over two things:
          the quality of what we sell, and making sure the people who make it are paid fairly.
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
          <h2 className="text-3xl font-extrabold tracking-tight">Meet a few of our artists</h2>
          <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all shrink-0">
            Shop all artists <ArrowRight className="w-4 h-4" />
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
          {getStorefrontTestimonials().map((t) => (
            <div key={t.name} className="bg-white rounded-3xl border border-border p-6">
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
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">Ready to find your next asset?</h2>
        <p className="mt-3 text-white/85 max-w-md mx-auto">Browse thousands of premium, print-ready designs — instant download, every time.</p>
        <Link to="/shop" className="inline-flex items-center justify-center gap-2 mt-7 px-7 py-3.5 rounded-full bg-white text-foreground font-semibold hover:scale-[1.03] transition-transform">
          Explore the Shop <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>

    <Footer />
  </div>
);

export default AboutPage;
