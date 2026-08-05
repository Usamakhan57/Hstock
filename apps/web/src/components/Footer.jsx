import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Github, Youtube, Facebook, Linkedin, Check } from 'lucide-react';
import Logo from './Logo';
import { newsletterApi } from '../services/api';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';

const SOCIAL_ICONS = {
  Instagram,
  Twitter,
  Github,
  Youtube,
  Facebook,
  Linkedin,
  X: Twitter,
  TikTok: Instagram,
  Pinterest: Instagram,
};

const PLATFORM_MAP = [
  { key: 'instagram', platform: 'Instagram' },
  { key: 'x', platform: 'X' },
  { key: 'facebook', platform: 'Facebook' },
  { key: 'youtube', platform: 'Youtube' },
  { key: 'linkedin', platform: 'Linkedin' },
  { key: 'github', platform: 'Github' },
  { key: 'tiktok', platform: 'TikTok' },
  { key: 'pinterest', platform: 'Pinterest' },
];

/** Inline newsletter signup — copy and labels come from Footer CMS. */
const NewsletterForm = ({ placeholder = '', buttonLabel = '' }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

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
    <form onSubmit={submit} className="mt-5 flex items-center gap-1.5 max-w-md bg-secondary/70 rounded-full pl-4 pr-1.5 py-1.5 border border-border focus-within:border-primary/40 transition-colors">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder || 'Email'}
        className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground py-1.5"
      />
      <button
        type="submit"
        disabled={status === 'loading' || !buttonLabel}
        className="shrink-0 px-4 h-9 rounded-full brand-gradient text-white text-xs font-semibold hover:opacity-95 active:scale-95 transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {buttonLabel}
      </button>
    </form>
  );
};

const Footer = () => {
  const { data: footer } = useCms(CMS_KEYS.FOOTER);
  const { data: social } = useCms(CMS_KEYS.SOCIAL);

  const columns = Array.isArray(footer?.columns) && footer.columns.length
    ? footer.columns
    : [];

  const bottomBadges = useMemo(() => {
    if (Array.isArray(footer?.bottomBadges) && footer.bottomBadges.length) {
      return footer.bottomBadges.filter((b) => b?.label);
    }
    // Legacy CMS: single tagline string → badge list
    if (footer?.tagline) {
      return String(footer.tagline)
        .split(/[·|•]/)
        .map((label) => label.trim())
        .filter(Boolean)
        .map((label, i) => ({ id: `legacy-${i}`, label }));
    }
    return [];
  }, [footer]);

  const socialLinks = useMemo(() => {
    // Prefer dedicated Social CMS (not embedded in footer).
    const fromSocial = PLATFORM_MAP
      .map(({ key, platform }) => {
        const url = social?.[key];
        if (!url) return null;
        return { id: `social-${key}`, platform, url };
      })
      .filter(Boolean);
    if (fromSocial.length) return fromSocial;
    // Legacy fallback only if Social CMS is empty and footer still has links.
    return Array.isArray(footer?.socialLinks)
      ? footer.socialLinks.filter((l) => l?.url && l.url !== '#')
      : [];
  }, [social, footer]);

  const copyright = String(footer?.copyrightText || '')
    .replace('{year}', String(new Date().getFullYear()));

  const newsletter = footer?.newsletter || {};

  return (
    <footer className="mt-24 border-t border-border bg-white">
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
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
                  if (!href) return null;
                  return (
                    <a
                      key={link.id || link.platform}
                      href={href}
                      aria-label={link.platform || 'Social'}
                      className="grid place-items-center w-9 h-9 rounded-full bg-secondary text-primary hover:brand-gradient hover:text-white transition-colors"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Ic className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
            {newsletter.enabled !== false && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-8 mb-1">
                  {newsletter.title || ''}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {newsletter.description || ''}
                </p>
                <NewsletterForm
                  placeholder={newsletter.placeholder || ''}
                  buttonLabel={newsletter.buttonLabel || ''}
                />
              </>
            )}
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold mb-4">{c.title}</h4>
              <ul className="space-y-2.5">
                {(c.links || []).map((l) => (
                  <li key={`${c.title}-${l.name}-${l.to || l.url}`}>
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
          <p className="text-xs text-muted-foreground whitespace-pre-line text-center sm:text-left">
            {copyright}
          </p>
          {bottomBadges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {bottomBadges.map((badge) => (
                <span key={badge.id || badge.label} className="text-xs text-muted-foreground">
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
