import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoSrc from '../assets/apna-store-logo.png';

/** Canonical marketplace logo asset — use this everywhere. */
export const LOGO_SRC = logoSrc;

const SIZE_CLASS = {
  header: 'h-10 sm:h-11 md:h-12', // 40–48px
  sidebar: 'h-8 md:h-10', // 32–40px
  footer: 'h-12 md:h-14',
  auth: 'h-16', // ~64px
  empty: 'h-14',
  icon: 'h-8 w-8',
};

/**
 * Shared ApnaStore logo.
 * @param {'header'|'sidebar'|'footer'|'auth'|'empty'|'icon'} [size]
 * @param {string|null} [to] — wrap in Link when provided (e.g. "/")
 */
const Logo = ({
  size = 'header',
  to = null,
  className = '',
  imgClassName = '',
  alt = 'ApnaStore',
  priority = false,
  onClick,
}) => {
  const image = (
    <img
      src={LOGO_SRC}
      alt={alt}
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
        aria-label="ApnaStore home"
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

export default Logo;
