import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Github, Youtube, ArrowRight, Check } from 'lucide-react';
import Logo from './Logo';
import { newsletterApi } from '../services/api';

const cols = [
  { title: 'Marketplace', links: [
    { name: 'Shop All', to: '/shop' },
    { name: 'Categories', to: '/categories' },
    { name: 'Best Sellers', to: '/shop?sort=Most%20Popular' },
    { name: 'Become a Seller', to: '/become-a-seller' },
  ] },
  { title: 'Company', links: [
    { name: 'About', to: '/about' },
    { name: 'Blog', to: '/blog' },
    { name: 'Contact', to: '/contact' },
    { name: 'Seller Hub', to: '/seller' },
  ] },
  { title: 'Support', links: [
    { name: 'FAQ', to: '/faq' },
    { name: 'Buyer Guide', to: '/buyer-guide' },
    { name: 'Seller Guide', to: '/seller-guide' },
    { name: 'Order History', to: '/orders' },
    { name: 'Help Center', to: '/support' },
  ] },
  { title: 'Legal', links: [
    { name: 'Privacy Policy', to: '/privacy' },
    { name: 'Terms & Conditions', to: '/terms' },
    { name: 'Refund Policy', to: '/refund-policy' },
  ] },
];

/** Inline newsletter signup — wired to the mock newsletterApi service. */
const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    await newsletterApi.subscribe(email.trim());
    setStatus('done');
    setEmail('');
  };

  if (status === 'done') {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-primary mt-5">
        <Check className="w-4 h-4" /> You're subscribed — thanks!
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 flex items-center gap-1.5 max-w-xs bg-secondary/70 rounded-full pl-4 pr-1.5 py-1.5 border border-border focus-within:border-primary/40 transition-colors">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        aria-label="Email address for newsletter"
        className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground py-1.5"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        aria-label="Subscribe to newsletter"
        className="shrink-0 grid place-items-center w-9 h-9 rounded-full brand-gradient text-white hover:opacity-95 active:scale-95 transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
};

const Footer = () => (
  <footer className="mt-24 border-t border-border bg-white">
    <div className="mx-auto max-w-[90rem] px-5 lg:px-8 py-16">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo to="/" size="footer" className="mb-4" />
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            ApnaStore is a secure marketplace for digital accounts, domains, websites, SaaS, and software assets — protected by escrow and built for verified sellers.
          </p>
          <div className="flex gap-2 mt-5">
            {[Instagram, Twitter, Github, Youtube].map((Ic, i) => (
              <a key={i} href="#" aria-label="Social" className="grid place-items-center w-9 h-9 rounded-full bg-secondary text-primary hover:brand-gradient hover:text-white transition-colors">
                <Ic className="w-4 h-4" />
              </a>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-8 mb-1">Newsletter</p>
          <p className="text-xs text-muted-foreground max-w-xs">New drops, deals, and creator spotlights — no spam.</p>
          <NewsletterForm />
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold mb-4">{c.title}</h4>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.name}><Link to={l.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">{l.name}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ApnaStore. All rights reserved. apnastore.org</p>
        <p className="text-xs text-muted-foreground">Escrow protection · Cryptomus payments · Verified sellers</p>
      </div>
    </div>
  </footer>
);

export default Footer;
