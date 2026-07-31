import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Simple page-number pager. `page` is 1-indexed; `onPageChange` receives
 * the new page number. Renders nothing when everything fits on one page.
 */
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }).map((_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            aria-current={page === n}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              page === n ? 'brand-gradient text-white' : 'border border-border hover:bg-secondary'
            }`}
          >
            {n}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
