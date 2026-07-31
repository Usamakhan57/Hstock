import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ArrowRight } from 'lucide-react';

/** Brand-styled illustration: empty portfolio folder with floating sparkles. */
const EmptyIllustration = () => (
  <svg viewBox="0 0 200 140" className="w-44 h-auto mx-auto" role="img" aria-label="No items illustration">
    <defs>
      <linearGradient id="pm-empty-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6C3BFF" />
        <stop offset="55%" stopColor="#8F63FF" />
        <stop offset="100%" stopColor="#FF4FD8" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="122" rx="64" ry="10" fill="#6C3BFF" opacity="0.08" />
    <rect x="52" y="46" width="96" height="66" rx="12" fill="white" stroke="#E5DEFB" strokeWidth="2" />
    <path d="M52 62c0-8.8 7.2-16 16-16h20l10 12h34c8.8 0 16 7.2 16 16v38c0 8.8-7.2 16-16 16H68c-8.8 0-16-7.2-16-16V62z" fill="url(#pm-empty-grad)" opacity="0.14" />
    <rect x="66" y="72" width="68" height="6" rx="3" fill="#8F63FF" opacity="0.35" />
    <rect x="66" y="86" width="44" height="6" rx="3" fill="#8F63FF" opacity="0.2" />
    <circle cx="158" cy="38" r="4" fill="#FF4FD8" opacity="0.7" />
    <circle cx="42" cy="52" r="3" fill="#6C3BFF" opacity="0.55" />
    <path d="M168 62l2.2 5.2 5.2 2.2-5.2 2.2-2.2 5.2-2.2-5.2-5.2-2.2 5.2-2.2 2.2-5.2z" fill="url(#pm-empty-grad)" opacity="0.8" />
    <path d="M34 88l1.7 4 4 1.7-4 1.7-1.7 4-1.7-4-4-1.7 4-1.7 1.7-4z" fill="#FF4FD8" opacity="0.6" />
  </svg>
);

/**
 * Shown wherever a list has no results — search, filtered shop grids,
 * empty wishlist/cart, etc. Keeps the message friendly and always offers
 * a way forward.
 */
const EmptyState = ({
  title = 'Nothing here yet',
  message = 'We couldn\u2019t find any items to show. Try adjusting your search or explore our categories instead.',
  actionLabel = 'Browse Categories',
  actionTo = '/categories',
  secondaryLabel,
  onSecondary,
  children,
}) => (
  <div className="bg-white rounded-3xl border border-border soft-shadow p-10 sm:p-14 text-center">
    <EmptyIllustration />
    <h2 className="mt-5 text-lg font-bold">{title}</h2>
    <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{message}</p>
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      <Link
        to={actionTo}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <LayoutGrid className="w-4 h-4" /> {actionLabel}
      </Link>
      {secondaryLabel && (
        <button
          type="button"
          onClick={onSecondary}
          className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-white border border-border text-sm font-semibold hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {secondaryLabel} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
    {children}
  </div>
);

export default EmptyState;
