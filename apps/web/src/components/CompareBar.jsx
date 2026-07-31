import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

/**
 * Fixed-position bar that appears whenever one or more products are
 * queued for comparison. Mounted once near the app root (see App.jsx)
 * so it persists across route changes without any page needing to know
 * about it. Hidden on admin/seller dashboard routes, which have their
 * own fixed chrome.
 */
const CompareBar = () => {
  const { compareList, removeFromCompare, clearCompare, MAX_COMPARE } = useStore();
  const { pathname } = useLocation();

  if (compareList.length === 0) return null;
  if (pathname.startsWith('/admin') || pathname.startsWith('/seller')) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pointer-events-none">
      <div className="mx-auto max-w-3xl bg-white rounded-3xl border border-border soft-shadow-lg p-3 flex items-center gap-3 pointer-events-auto">
        <span className="hidden sm:flex items-center gap-1.5 text-sm font-semibold pl-2 shrink-0">
          <Scale className="w-4 h-4 text-primary" /> Compare ({compareList.length}/{MAX_COMPARE})
        </span>
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {compareList.map((p) => (
            <span key={p.id} className="relative shrink-0">
              <img src={p.img} alt={p.title} className="w-11 h-11 rounded-xl object-cover bg-secondary" />
              <button
                type="button"
                onClick={() => removeFromCompare(p.id)}
                aria-label={`Remove ${p.title} from compare`}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-white grid place-items-center"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <button type="button" onClick={clearCompare} className="hidden sm:inline text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0">
          Clear
        </button>
        <Link
          to="/compare"
          className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity"
        >
          Compare Now
        </Link>
      </div>
    </div>
  );
};

export default CompareBar;
