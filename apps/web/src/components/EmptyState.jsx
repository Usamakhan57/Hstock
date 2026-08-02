import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import Logo from './Logo';

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
    <Logo size="empty" className="mx-auto justify-center" />
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
