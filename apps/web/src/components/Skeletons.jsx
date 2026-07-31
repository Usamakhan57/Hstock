import React from 'react';

const Bone = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-secondary/80 ${className}`} aria-hidden="true" />
);

/** Matches ProductCard proportions so the grid doesn't shift on load. */
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-[1.75rem] border border-border overflow-hidden" aria-hidden="true">
    <Bone className="aspect-square" />
    <div className="px-4 pt-3.5 pb-4 space-y-2.5">
      <div className="flex justify-between"><Bone className="h-3 w-16" /><Bone className="h-3 w-10" /></div>
      <Bone className="h-4 w-4/5" />
      <Bone className="h-3 w-24" />
      <div className="pt-3.5 border-t border-border/70"><Bone className="h-5 w-16" /></div>
      <div className="flex justify-between items-center"><Bone className="h-3 w-20" /><Bone className="h-3 w-12" /></div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8, className = 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' }) => (
  <div className={className} role="status" aria-label="Loading products">
    {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    <span className="sr-only">Loading…</span>
  </div>
);

export const CategoryCardSkeleton = () => (
  <div className="bg-white rounded-3xl p-6 border border-border flex items-center gap-5" aria-hidden="true">
    <Bone className="w-16 h-16 rounded-2xl shrink-0" />
    <div className="flex-1 space-y-2.5"><Bone className="h-4 w-2/3" /><Bone className="h-3 w-1/3" /></div>
  </div>
);

export const CollectionCardSkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden border border-border" aria-hidden="true">
    <Bone className="h-56 rounded-none" />
    <div className="p-6 space-y-2.5"><Bone className="h-5 w-1/2" /><Bone className="h-3 w-4/5" /></div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="grid lg:grid-cols-2 gap-10" role="status" aria-label="Loading product">
    <div className="space-y-3">
      <Bone className="aspect-square rounded-3xl" />
      <div className="flex gap-3">{[0, 1, 2].map((i) => <Bone key={i} className="w-20 h-20 rounded-2xl" />)}</div>
    </div>
    <div className="space-y-4">
      <Bone className="h-3 w-24" />
      <Bone className="h-9 w-4/5" />
      <Bone className="h-4 w-40" />
      <Bone className="h-24 rounded-2xl" />
      <Bone className="h-14 rounded-2xl" />
      <Bone className="h-12 w-2/3 rounded-full" />
    </div>
    <span className="sr-only">Loading…</span>
  </div>
);

export const SearchResultsSkeleton = () => (
  <div className="mt-8 space-y-6" role="status" aria-label="Loading results">
    <Bone className="h-8 w-72" />
    <ProductGridSkeleton />
  </div>
);
