import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import fallbackLogo from '../assets/apna-store-logo.png';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';

/** Canonical marketplace logo asset — use this everywhere as fallback. */
export const LOGO_SRC = fallbackLogo;

const SIZE_CLASS = {
  header: 'h-10 sm:h-11 md:h-12',
  sidebar: 'h-8 md:h-10',
  footer: 'h-12 md:h-14',
  auth: 'h-16',
  empty: 'h-14',
  icon: 'h-8 w-8',
};

/**
 * Shared ApnaStore logo — src comes from Global CMS (logo / logoLight / logoDark).
 * Changing the logo in Admin updates the storefront immediately via useCms.
 */
const Logo = ({
  size = 'header',
  to = null,
  className = '',
  imgClassName = '',
  alt,
  priority = false,
  onClick,
  variant = 'default',
}) => {
  const { data: global } = useCms(CMS_KEYS.GLOBAL);
  const { data: header } = useCms(CMS_KEYS.HEADER, { enabled: size === 'header' });

  const src = useMemo(() => {
    if (variant === 'light' && global?.logoLight) return global.logoLight;
    if (variant === 'dark' && global?.logoDark) return global.logoDark;
    if (size === 'header' && header?.logo) return header.logo;
    if (size === 'footer' && global?.logo) return global.logo;
    return global?.logo || global?.logoLight || global?.logoDark || LOGO_SRC;
  }, [global, header, size, variant]);

  const siteName = global?.siteName || 'ApnaStore';
  const resolvedAlt = alt || siteName;

  const image = (
    <img
      src={src}
      alt={resolvedAlt}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      draggable="false"
      className={cn(
        'w-auto max-w-full object-contain object-center',
        SIZE_CLASS[size] || SIZE_CLASS.header,
        imgClassName,
      )}
    />
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        aria-label={`${siteName} home`}
        className={cn(
          'inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl',
          className,
        )}
      >
        {image}
      </Link>
    );
  }

  return (
    <span className={cn('inline-flex shrink-0 items-center', className)}>
      {image}
    </span>
  );
};

/** Keeps <link rel="icon"> in sync with Global CMS favicon. */
export function CmsBrandSync() {
  const { data: global } = useCms(CMS_KEYS.GLOBAL);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const favicon = global?.favicon;
    if (!favicon) return undefined;

    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      document.head.appendChild(link);
    }
    link.setAttribute('href', favicon);

    if (global?.siteName) {
      document.title = document.title.replace(/^[^|]+/, global.siteName);
    }
    return undefined;
  }, [global?.favicon, global?.siteName]);

  return null;
}

export default Logo;
