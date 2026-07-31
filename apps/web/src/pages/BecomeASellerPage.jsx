import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, Rocket, ShieldCheck, Users, TrendingUp, Palette } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { useSellerAuth } from '../context/SellerAuthContext';

const perks = [
  { icon: DollarSign, title: 'Keep more of every sale', text: 'Transparent commission with fast, reliable payouts straight to your account.' },
  { icon: Rocket, title: 'Reach active buyers', text: 'Your storefront is discoverable across search, categories, and curated collections.' },
  { icon: ShieldCheck, title: 'Licensing handled for you', text: 'Personal, Commercial, and Extended license tiers are built into every listing.' },
  { icon: TrendingUp, title: 'Real-time analytics', text: 'Track views, downloads, and earnings from your seller dashboard.' },
  { icon: Palette, title: 'Sell what you love', text: 'Wall art, planners, cliparts, fonts, mockups — any digital asset finds a home.' },
  { icon: Users, title: 'Grow a following', text: 'Build a store page buyers can browse, follow, and come back to.' },
];

const steps = [
  { n: '01', t: 'Create your seller account', d: 'Sign up with your store name and email — takes under two minutes.' },
  { n: '02', t: 'Upload your first products', d: 'Add files, previews, pricing, and pick your license tiers.' },
  { n: '03', t: 'Get discovered & paid', d: 'Buyers find your work across HStock; you track earnings in your dashboard.' },
];

const BecomeASellerPage = () => {
  const { isAuthenticated } = useSellerAuth();

  return (
    <div className="min-h-screen">
      <Seo title="Become a Seller" description="Open your storefront on HStock and sell wall art, planners, cliparts, fonts and digital bundles to buyers worldwide." />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F3EEFF] via-[#FBF7FF] to-[#FFEFFA]" />
        <div className="absolute -top-40 -right-32 w-[42rem] h-[42rem] rounded-full brand-gradient opacity-20 blur-3xl" />
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8 pt-16 lg:pt-24 pb-16 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-border soft-shadow">
            Join thousands of independent creators
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
            Turn your creativity into <span className="brand-text italic">income</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Sell wall art, planners, cliparts, fonts, and digital bundles to buyers around the world — on a marketplace built for creators.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to={isAuthenticated ? '/seller/dashboard' : '/seller/register'}
              className="group inline-flex items-center gap-2 brand-gradient text-white font-semibold px-8 py-4 rounded-full soft-shadow-lg hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              {isAuthenticated ? 'Go to your dashboard' : 'Start selling today'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {!isAuthenticated && (
              <Link to="/seller/login" className="inline-flex items-center gap-2 bg-white text-foreground font-semibold px-8 py-4 rounded-full border border-border hover:bg-secondary hover:-translate-y-0.5 transition-all">
                I already have a store
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-[90rem] px-5 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">Why sell on HStock</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {perks.map((p) => (
            <div key={p.title} className="bg-white rounded-3xl p-6 border border-border soft-shadow">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-4">
                <p.icon className="w-6 h-6" strokeWidth={1.8} />
              </span>
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">How it works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="bg-white rounded-3xl p-7 border border-border soft-shadow">
                <span className="text-4xl font-black brand-text">{s.n}</span>
                <h3 className="font-bold text-lg mt-3">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to={isAuthenticated ? '/seller/dashboard' : '/seller/register'}
              className="inline-flex items-center gap-2 brand-gradient text-white font-semibold px-8 py-4 rounded-full soft-shadow-lg hover:opacity-95 hover:-translate-y-0.5 transition-all"
            >
              {isAuthenticated ? 'Go to your dashboard' : 'Create your seller account'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomeASellerPage;
