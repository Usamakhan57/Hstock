import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, Rocket, ShieldCheck, Palette } from 'lucide-react';

const perks = [
  { icon: DollarSign, text: 'Keep more of every sale with fast payouts' },
  { icon: Rocket, text: 'Reach thousands of active buyers worldwide' },
  { icon: ShieldCheck, text: 'Licensing handled for you on every listing' },
];

/** Brand-styled illustration: artist storefront with rising earnings. */
const SellerIllustration = () => (
  <svg viewBox="0 0 280 220" className="w-full h-auto max-w-sm mx-auto" role="img" aria-label="Creator storefront illustration">
    <defs>
      <linearGradient id="pm-seller-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6C3BFF" />
        <stop offset="55%" stopColor="#8F63FF" />
        <stop offset="100%" stopColor="#FF4FD8" />
      </linearGradient>
    </defs>
    <ellipse cx="140" cy="196" rx="104" ry="14" fill="#6C3BFF" opacity="0.08" />
    {/* storefront card */}
    <rect x="46" y="52" width="148" height="120" rx="18" fill="white" stroke="#E5DEFB" strokeWidth="2" />
    <rect x="46" y="52" width="148" height="30" rx="18" fill="url(#pm-seller-grad)" opacity="0.9" />
    <rect x="46" y="70" width="148" height="12" fill="white" />
    <circle cx="66" cy="67" r="4" fill="white" opacity="0.9" />
    <rect x="78" y="63" width="52" height="8" rx="4" fill="white" opacity="0.85" />
    {/* mini listings */}
    <rect x="60" y="94" width="36" height="36" rx="9" fill="#F1EBFF" />
    <rect x="102" y="94" width="36" height="36" rx="9" fill="#FFE9F9" />
    <rect x="144" y="94" width="36" height="36" rx="9" fill="#F1EBFF" />
    <rect x="60" y="138" width="76" height="7" rx="3.5" fill="#8F63FF" opacity="0.3" />
    <rect x="60" y="151" width="48" height="7" rx="3.5" fill="#8F63FF" opacity="0.18" />
    {/* earnings chart card */}
    <rect x="168" y="118" width="86" height="66" rx="14" fill="white" stroke="#E5DEFB" strokeWidth="2" />
    <polyline points="180,168 196,156 210,160 226,142 242,132" fill="none" stroke="url(#pm-seller-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="242" cy="132" r="5" fill="#FF4FD8" />
    {/* price tag */}
    <g transform="rotate(-12 62 40)">
      <rect x="30" y="24" width="64" height="30" rx="10" fill="url(#pm-seller-grad)" />
      <text x="62" y="44" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="Inter, sans-serif">$1.2k</text>
    </g>
    {/* sparkles */}
    <path d="M228 34l2.6 6 6 2.6-6 2.6-2.6 6-2.6-6-6-2.6 6-2.6 2.6-6z" fill="url(#pm-seller-grad)" opacity="0.85" />
    <circle cx="206" cy="66" r="4" fill="#FF4FD8" opacity="0.6" />
    <circle cx="34" cy="96" r="3.5" fill="#6C3BFF" opacity="0.5" />
  </svg>
);

/**
 * Premium "Become a Seller" section for the homepage — consistent with the
 * existing rounded-card design language and brand gradient.
 */
const SellerCTA = () => (
  <section className="mx-auto max-w-[90rem] px-5 lg:px-8 mt-24" aria-label="Become a seller">
    <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-border soft-shadow">
      <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full brand-gradient opacity-[0.07] blur-3xl" aria-hidden="true" />
      <div className="grid lg:grid-cols-2 gap-10 items-center p-8 sm:p-12 lg:p-16">
        <div>
          <p className="text-sm font-semibold text-primary mb-2">For creators</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Turn your art into <span className="brand-text italic">income</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md leading-relaxed">
            Open your own storefront on ApnaStore and sell wall art, planners, cliparts, fonts and bundles to buyers around the world.
          </p>
          <ul className="mt-6 space-y-3">
            {perks.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-sm font-medium text-foreground/85">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
                  <p.icon className="w-4.5 h-4.5" strokeWidth={1.9} aria-hidden="true" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/become-a-seller"
              className="group inline-flex items-center gap-2 brand-gradient text-white font-semibold px-8 py-4 rounded-full soft-shadow-lg hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Become a Seller <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              to="/seller/login"
              className="inline-flex items-center gap-2 bg-white text-foreground font-semibold px-8 py-4 rounded-full border border-border hover:bg-secondary hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              I already have a store
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-2xl" aria-hidden="true" />
          <div className="relative animate-float-slow">
            <SellerIllustration />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SellerCTA;
