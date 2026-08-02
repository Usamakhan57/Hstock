import React from 'react';
import { PRODUCT_GRID_CLASS } from '../lib/productGrid';

const Bone = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-secondary/80 ${className}`} aria-hidden="true" />
);

/** Matches ProductCard proportions so the grid doesn't shift on load. */
export const ProductCardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-white" aria-hidden="true">
    <Bone className="aspect-[4/3] rounded-none" />
    <div className="space-y-2 px-2.5 pb-2.5 pt-2">
      <Bone className="h-3.5 w-4/5" />
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-3/5" />
      <Bone className="h-2.5 w-20" />
      <div className="flex items-center justify-between pt-1">
        <Bone className="h-5 w-12" />
        <Bone className="h-7 w-14 rounded-md" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 12, className = PRODUCT_GRID_CLASS }) => (
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
