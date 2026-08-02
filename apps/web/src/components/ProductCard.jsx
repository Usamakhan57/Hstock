import { useState, startTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Hand, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/context/WishlistContext";
import { mediaUrl } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { productPath } from "@/lib/slugPaths";
import QuickViewModal from "@/components/QuickViewModal";

export default function ProductCard({ product, className }) {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quickOpen, setQuickOpen] = useState(false);
  const wished = isWishlisted(product.id);
  const href = productPath(product);
  const cover = mediaUrl(product.images?.[0]);
  const stockLeft = Number(product.stock_count || 0);
  const isInstant = product.delivery_type === "instant";
  const sellerSlug = product.seller_shop_slug || product.seller_id;
  const subtitle =
    product.short_description ||
    product.description ||
    product.category_name ||
    "";

  return (
    <>
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
          className
        )}
        data-testid={`product-card-${product.id}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Link to={href} className="absolute inset-0 block" aria-label={product.title}>
            {cover ? (
              <img
                src={cover}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-secondary text-xs font-semibold text-muted-foreground">
                No image
              </div>
            )}
          </Link>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-1.5 p-1.5">
            <div className="flex min-w-0 flex-wrap gap-1">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
                  isInstant ? "bg-emerald-600" : "bg-primary"
                )}
              >
                {isInstant ? <Zap className="h-2.5 w-2.5" /> : <Hand className="h-2.5 w-2.5" />}
                <span className="max-w-[4.5rem] truncate sm:max-w-none">{isInstant ? "Instant Access" : "Manual"}</span>
              </span>
              {product.is_featured ? (
                <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Featured
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className={cn(
                "pointer-events-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-sm backdrop-blur transition hover:scale-105",
                wished ? "text-rose-500" : "text-foreground/70"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              data-testid={`wishlist-btn-${product.id}`}
            >
              <Heart className={cn("h-3.5 w-3.5", wished && "fill-current")} />
            </button>
          </div>

          {stockLeft > 0 ? (
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {stockLeft} Left
            </span>
          ) : (
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Sold out
            </span>
          )}

          <button
            type="button"
            className="absolute inset-x-2 bottom-2 z-10 hidden translate-y-1 rounded-md bg-foreground/90 px-2 py-1.5 text-[11px] font-semibold text-background opacity-0 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 md:block"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickOpen(true);
            }}
            data-testid={`quick-view-${product.id}`}
          >
            Quick View
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
          <Link
            to={href}
            className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors hover:text-primary"
          >
            {product.title}
          </Link>

          {subtitle ? (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
              {String(subtitle).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
            </p>
          ) : null}

          {product.seller_shop_name ? (
            <button
              type="button"
              className="inline-flex max-w-full items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startTransition(() => navigate(`/seller/${sellerSlug}`));
              }}
            >
              <span className="truncate">by {product.seller_shop_name}</span>
              {product.seller_is_verified ? (
                <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  ✓
                </span>
              ) : null}
            </button>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <p className="truncate text-base font-extrabold tracking-tight text-emerald-600 sm:text-lg">
              {formatMoney(product.price, product.currency || "USD")}
            </p>
            <Button
              asChild
              size="sm"
              className="h-8 shrink-0 gap-1 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Link to={href} data-testid={`view-product-${product.id}`}>
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </article>

      <QuickViewModal open={quickOpen} onOpenChange={setQuickOpen} product={product} />
    </>
  );
}
