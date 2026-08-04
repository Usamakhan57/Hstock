import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Github, Youtube, ArrowRight, Check } from 'lucide-react';
import Logo from './Logo';
import { newsletterApi } from '../services/api';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';

const SOCIAL_ICONS = {
  Instagram,
  Twitter,
  Github,
  Youtube,
  X: Twitter,
};

/** Inline newsletter signup — wired to the mock newsletterApi service. */
const NewsletterForm = ({ placeholder = 'Your email' }) => {
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
        placeholder={placeholder}
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

const Footer = () => {
  const { data: footer } = useCms(CMS_KEYS.FOOTER);
  const columns = Array.isArray(footer?.columns) && footer.columns.length
    ? footer.columns
    : [];
  const socialLinks = Array.isArray(footer?.socialLinks) ? footer.socialLinks : [];
  const copyright = String(footer?.copyrightText || '© {year} ApnaStore. All rights reserved.')
    .replace('{year}', String(new Date().getFullYear()));

  return (
    <footer className="mt-24 border-t border-border bg-white">
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo to="/" size="footer" className="mb-4" />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {footer?.description || ''}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-2 mt-5">
                {socialLinks.map((link) => {
                  const Ic = SOCIAL_ICONS[link.platform] || Instagram;
                  const href = link.url && link.url !== '#' ? link.url : undefined;
                  return (
                    <a
                      key={link.id || link.platform}
                      href={href || undefined}
                      aria-label={link.platform || 'Social'}
                      className="grid place-items-center w-9 h-9 rounded-full bg-secondary text-primary hover:brand-gradient hover:text-white transition-colors"
                      {...(href ? { target: '_blank', rel: 'noreferrer' } : { onClick: (e) => e.preventDefault() })}
                    >
                      <Ic className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
            {footer?.newsletter?.enabled !== false && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-8 mb-1">
                  {footer?.newsletter?.title || 'Newsletter'}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {footer?.newsletter?.description || ''}
                </p>
                <NewsletterForm placeholder={footer?.newsletter?.placeholder || 'Your email'} />
              </>
            )}
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold mb-4">{c.title}</h4>
              <ul className="space-y-2.5">
                {(c.links || []).map((l) => (
                  <li key={l.name}>
                    <Link to={l.to || l.url || '/'} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{copyright}</p>
          <p className="text-xs text-muted-foreground">{footer?.tagline || ''}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
