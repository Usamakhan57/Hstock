import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Wallet, User, Menu, X, ChevronDown, LayoutGrid, Bell,
  Clock, TrendingUp, ArrowUpRight, Folder, Hash, LucideStore,
} from 'lucide-react';
import { LOGO } from '../data';
import { useStore } from '../context/StoreContext';
import { useSellerAuth } from '../context/SellerAuthContext';
import { productsApi, walletApi } from '../services/api';
import SellerSidebar from './SellerSidebar';
import { getCategoryTreeForStorefront } from '../services/categoryRepository';
import { getProductCountByCategoryId } from '../services/productRepository';
import { getRolledUpCount } from '../services/categoryTree';
import { POPULAR_SEARCHES, POPULAR_TAGS, RECENT_SEARCHES_KEY, MAX_RECENT_SEARCHES } from '../constants';

/**
 * Header-only visibility rule, kept local to this component (the shared
 * Category Service stays untouched — Shop already relies on its current
 * behavior). `getHeaderCategoryTree()` in the service filters to
 * `c.showInHeader` with strict truthiness *before* the tree is built, so
 * any category — parent or child — that predates the `showInHeader` field
 * (or simply had it left unset) is dropped instead of shown, and any of
 * its children are silently orphaned along with it. That's why the mega
 * menu panel renders completely empty even though the same categories
 * appear correctly on the Shop page (which never filters on
 * `showInHeader` at all).
 *
 * Fix: pull the full active-category tree from the service
 * (`getCategoryTreeForStorefront`, already unfiltered by `showInHeader`)
 * and apply a lenient, default-safe visibility check ourselves — a
 * category is shown in the header unless it is *explicitly* flagged
 * `showInHeader: false`. Missing/undefined is treated as visible.
 */
const isHeaderVisible = (cat) => cat.showInHeader !== false;

/** Recursively rebuild the tree keeping header-visible nodes at every level, so one
 * node's missing/false flag never hides otherwise-visible descendants. Every node
 * survives here regardless of whether it has children — leaf categories still render. */
const buildHeaderTree = (nodes) => nodes
  .filter(isHeaderVisible)
  .map((node) => ({ ...node, children: buildHeaderTree(node.children || []) }));

/** Fallback accent used whenever a category is missing (or has an invalid) `color`. */
const DEFAULT_CATEGORY_COLOR = '#7C3AED';

/**
 * Resolve a category's icon to an actual renderable component. Never trust `cat.icon`
 * blindly — a missing field, a stale string, or any non-component value falls back to
 * the generic Folder icon instead of crashing `<Icon />` or rendering nothing.
 *
 * IMPORTANT: lucide-react icons are built with `React.forwardRef`, so a real icon
 * component has `typeof icon === 'object'` (a forwardRef wrapper), NOT `'function'`.
 * Checking `typeof cat.icon === 'function'` rejects every valid icon and silently
 * replaces all of them with the Folder fallback — categories still render, but never
 * with their real icon. Accept both shapes and only fall back when the value is
 * actually missing/invalid (null/undefined/string/etc.).
 */
const resolveIcon = (cat) => {
  const icon = cat?.icon;
  const isComponent = typeof icon === 'function' || (typeof icon === 'object' && icon !== null);
  return isComponent ? icon : Folder;
};

/** Resolve a category's accent color, falling back to the default theme color when absent. */
const resolveColor = (cat) => (typeof cat?.color === 'string' && cat.color.trim() ? cat.color : DEFAULT_CATEGORY_COLOR);

/** Resolve a category's slug for routing — falls back to id, then to an empty string, so a
 * category missing `slug` still renders a (best-effort) link instead of throwing or vanishing. */
const resolveSlug = (cat) => (typeof cat?.slug === 'string' && cat.slug.trim() ? cat.slug : (cat?.id ?? ''));

/** Resolve a category's display name — falls back to a placeholder rather than rendering blank text. */
const resolveName = (cat) => (typeof cat?.name === 'string' && cat.name.trim() ? cat.name : 'Untitled');

/** Stable React key for a category node even when `id` is missing — falls back to slug, then name. */
const resolveKey = (cat) => cat?.id ?? cat?.slug ?? cat?.name;

/**
 * Recursive mega-menu row: Parent → Child → Grandchild → … to unlimited depth.
 * Every node renders itself unconditionally (leaf categories included — a category
 * is never skipped just because it has no children), then recurses into its own
 * `children` array only when non-empty. Icon/color/slug/name are always resolved
 * through the helpers above rather than read off the node directly, so `<Icon />`
 * is only ever rendered with a guaranteed-valid component and the row never breaks
 * on a category missing one of id/name/slug/icon/color.
 */
const CategoryMegaNode = ({ category, depth = 0, onNavigate }) => {
  const Icon = resolveIcon(category);
  const color = resolveColor(category);
  const name = resolveName(category);
  const slug = resolveSlug(category);
  const children = Array.isArray(category?.children) ? category.children : [];

  return (
    <div className={depth > 0 ? 'mt-0.5' : ''}>
      <Link
        to={`/category/${slug}`}
        onClick={onNavigate}
        role="menuitem"
        className={`flex items-center gap-3 rounded-xl hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          depth === 0 ? 'py-1' : 'py-1'
        }`}
        style={{ paddingLeft: depth * 16 }}
      >
        {depth === 0 ? (
          <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: `${color}18`, color }}>
            <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
          </span>
        ) : (
          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${depth === 0 ? 'text-sm font-semibold' : 'text-[12.5px] font-medium text-foreground/80'}`}>
            {name}
          </span>
          {depth === 0 && (
            <span className="block text-xs text-muted-foreground">{(category.count ?? 0).toLocaleString()} items</span>
          )}
        </span>
      </Link>
      {children.length > 0 && (
        <div>
          {children.map((child) => (
            <CategoryMegaNode key={resolveKey(child)} category={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};

const navLinks = [
  { name: 'Home', to: '/' },
  { name: 'Shop', to: '/shop' },
  { name: 'Collections', to: '/collections' },
  { name: 'Blog', to: '/blog' },
  { name: 'About', to: '/about' },
];

/* ---------------------------------------------------- recent searches */
const loadRecent = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || []; } catch { return []; }
};
const saveRecent = (term) => {
  const next = [term, ...loadRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
};

/* --------------------------------------------- live search suggestions */
const EMPTY_SUGGESTIONS = { products: [], categories: [], artists: [] };

const SearchSuggestions = ({ query, recent, onPick, onClearRecent }) => {
  const [suggestions, setSuggestions] = useState(EMPTY_SUGGESTIONS);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const hasQuery = query.trim().length > 0;
  const hasResults = suggestions.products.length || suggestions.categories.length || suggestions.artists.length;

  useEffect(() => {
    const needle = query.trim();
    if (!needle) {
      setSuggestions(EMPTY_SUGGESTIONS);
      setSuggestLoading(false);
      return undefined;
    }

    let alive = true;
    setSuggestLoading(true);
    const timer = window.setTimeout(() => {
      productsApi.suggest(needle)
        .then((result) => {
          if (alive) setSuggestions(result || EMPTY_SUGGESTIONS);
        })
        .catch(() => {
          if (alive) setSuggestions(EMPTY_SUGGESTIONS);
        })
        .finally(() => {
          if (alive) setSuggestLoading(false);
        });
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-3xl border border-border shadow-[0_30px_70px_-20px_rgba(108,59,255,0.28)] p-4 animate-mega-in max-h-[70vh] overflow-y-auto z-50">
      {!hasQuery ? (
        <>
          {recent.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Recent searches
                </p>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); onClearRecent(); }} className="text-xs font-semibold text-primary hover:opacity-80">
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((t) => (
                  <button key={t} type="button" onMouseDown={(e) => { e.preventDefault(); onPick(t); }} className="text-sm px-3.5 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 px-1 mb-2">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> Popular searches
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {POPULAR_SEARCHES.map((t) => (
              <button key={t} type="button" onMouseDown={(e) => { e.preventDefault(); onPick(t); }} className="text-sm px-3.5 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors">
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 px-1 mb-2">
            <Hash className="w-3.5 h-3.5" aria-hidden="true" /> Popular tags
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((t) => (
              <button key={t} type="button" onMouseDown={(e) => { e.preventDefault(); onPick(t); }} className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary transition-colors">
                #{t}
              </button>
            ))}
          </div>
        </>
      ) : suggestLoading ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">Searching…</p>
        </div>
      ) : !hasResults ? (
        <div className="py-6 text-center">
          <p className="text-sm font-semibold">No matches for “{query}”</p>
          <p className="text-xs text-muted-foreground mt-1">Press Enter to search everything, or try a different term.</p>
        </div>
      ) : (
        <>
          {suggestions.products.length > 0 && (
            <ul className="mb-2">
              {suggestions.products.map((p) => (
                <li key={p.id}>
                  <Link to={`/product/${p.id}`} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-secondary transition-colors" onMouseDown={(e) => e.preventDefault()}>
                    <img src={p.img} alt="" aria-hidden="true" className="w-10 h-10 rounded-xl object-cover bg-secondary shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{p.title}</span>
                      <span className="block text-xs text-muted-foreground">{p.cat} · by {p.artist}</span>
                    </span>
                    <span className="text-sm font-bold shrink-0">${p.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {(suggestions.categories.length > 0 || suggestions.artists.length > 0) && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {suggestions.categories.map((c) => (
                <Link key={c.id} to={`/category/${c.slug}`} onMouseDown={(e) => e.preventDefault()} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary transition-colors">
                  Category: {c.name} <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              ))}
              {suggestions.artists.map((a) => (
                <Link key={a.slug} to={`/seller/${a.slug}`} onMouseDown={(e) => e.preventDefault()} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors">
                  Artist: {a.name} <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [sellerDrawerOpen, setSellerDrawerOpen] = useState(false);
  const [sellerDrawerClosing, setSellerDrawerClosing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [recent, setRecent] = useState(loadRecent);
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout, notifications, markNotificationRead, catalogVersion } = useStore();
  const { seller, isAuthenticated: isSellerAuthenticated, logout: logoutSeller } = useSellerAuth();
  const isUserLoggedIn = Boolean(user);
  const isSellerUser = Boolean(user?.roles?.includes?.('seller') || isSellerAuthenticated);
  const sellerNotificationsCount = notifications.filter((n) => !n.read).length;
  const [sellerWalletBalance, setSellerWalletBalance] = useState(0);
  const megaRef = useRef(null);
  const searchRef = useRef(null);
  const drawerCloseTimeoutRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!isSellerUser || !isUserLoggedIn) {
      setSellerWalletBalance(0);
      return undefined;
    }
    let alive = true;
    walletApi.me()
      .then((wallet) => {
        if (!alive) return;
        setSellerWalletBalance(Number(wallet?.availableBalance ?? wallet?.withdrawableBalance ?? 0) || 0);
      })
      .catch(() => {
        if (alive) setSellerWalletBalance(0);
      });
    return () => { alive = false; };
  }, [isSellerUser, isUserLoggedIn, loc.pathname]);

  const showSellerDrawer = sellerDrawerOpen || sellerDrawerClosing;
  const openSellerDrawer = () => {
    if (drawerCloseTimeoutRef.current) {
      window.clearTimeout(drawerCloseTimeoutRef.current);
      drawerCloseTimeoutRef.current = null;
    }
    setSellerDrawerClosing(false);
    setSellerDrawerOpen(true);
  };
  const closeSellerDrawer = () => {
    if (!sellerDrawerOpen) return;
    setSellerDrawerOpen(false);
    setSellerDrawerClosing(true);
    if (drawerCloseTimeoutRef.current) {
      window.clearTimeout(drawerCloseTimeoutRef.current);
    }
    drawerCloseTimeoutRef.current = window.setTimeout(() => {
      setSellerDrawerClosing(false);
      drawerCloseTimeoutRef.current = null;
    }, 250);
  };

  const headerCategories = useMemo(() => {
    const tree = buildHeaderTree(getCategoryTreeForStorefront());
    const counts = getProductCountByCategoryId();
    return tree.map((c) => ({ ...c, count: getRolledUpCount(c, counts) }));
  }, [catalogVersion]);

  const goSearch = useCallback((term) => {
    const t = term.trim();
    if (t) setRecent(saveRecent(t));
    navigate(t ? `/search?q=${encodeURIComponent(t)}` : '/search');
    setSearchFocused(false);
    setOpen(false);
  }, [navigate]);

  const submitSearch = (e) => {
    e.preventDefault();
    goSearch(searchValue);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setMega(false); setSearchFocused(false); setSellerDrawerOpen(false); setNotifOpen(false); }, [loc]);

  useEffect(() => {
    const onClick = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setMega(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') { setMega(false); setSearchFocused(false); closeSellerDrawer(); setNotifOpen(false); } };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    document.body.style.overflow = showSellerDrawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSellerDrawer]);
  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(108,59,255,0.18)] border-b border-border/60' : 'bg-white/40 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-primary focus:font-semibold focus:text-sm focus:px-4 focus:py-2 focus:rounded-full focus:soft-shadow">
        Skip to main content
      </a>

      {/* ROW 1 — logo, search, actions */}
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-6 h-[64px] sm:h-[80px] md:h-[88px]">
          {/* Logo — enlarged for stronger branding */}
          <Link to="/" className="flex items-center shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl" aria-label="HStock home">
            <img
              src={LOGO}
              alt="HStock"
              width="220"
              height="72"
              className="h-9 sm:h-16 md:h-[4.5rem] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              draggable="false"
            />
          </Link>

          {/* Search bar — large, rounded, premium, with live suggestions */}
          <div ref={searchRef} className="hidden md:block relative flex-1 max-w-2xl mx-auto">
            <form
              onSubmit={submitSearch}
              role="search"
              className="flex items-center gap-2 bg-white rounded-full pl-5 pr-2 py-1.5 border border-border shadow-sm focus-within:shadow-[0_0_0_4px_rgba(108,59,255,0.12)] focus-within:border-primary/40 transition-all duration-300"
            >
              <Search className="w-4.5 h-4.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                aria-label="Search products"
                aria-expanded={searchFocused}
                aria-haspopup="listbox"
                autoComplete="off"
                placeholder="Search for anything…"
                className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground py-2"
              />
              <button
                type="submit"
                className="shrink-0 grid place-items-center w-10 h-10 rounded-full brand-gradient text-white hover:opacity-95 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
            {searchFocused && (
              <SearchSuggestions
                query={searchValue}
                recent={recent}
                onPick={goSearch}
                onClearRecent={() => { localStorage.removeItem(RECENT_SEARCHES_KEY); setRecent([]); }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 ml-auto md:ml-0 shrink-0">
            {user && (
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-expanded={notifOpen}
                  aria-haspopup="menu"
                  aria-label={`Notifications${notifications.filter((n) => !n.read).length > 0 ? `, ${notifications.filter((n) => !n.read).length} unread` : ''}`}
                  className="relative p-2.5 rounded-full hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5" aria-hidden="true" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-semibold grid place-items-center rounded-full bg-accent text-white" aria-hidden="true">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white rounded-2xl border border-border soft-shadow-lg py-2 animate-mega-in z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-1.5">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notifications</span>
                      <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-semibold text-primary hover:underline">View all</Link>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-muted-foreground">You're all caught up.</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <Link
                          key={n.id}
                          to={n.link || '/notifications'}
                          role="menuitem"
                          onClick={() => { markNotificationRead(n.id); setNotifOpen(false); }}
                          className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-secondary transition-colors"
                        >
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                          <span className="min-w-0">
                            <span className={`block text-sm ${n.read ? 'font-medium' : 'font-bold'} truncate`}>{n.title}</span>
                            <span className="block text-xs text-muted-foreground truncate">{n.body}</span>
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {!isUserLoggedIn && (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 pl-2 pr-4 py-2 rounded-full hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid place-items-center w-8 h-8 rounded-full bg-secondary text-primary">
                  <User className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold leading-tight text-left">Sign in</span>
              </Link>
            )}

            {isUserLoggedIn && (
              <Link to="/wallet" aria-label="Payments wallet" className="flex items-center gap-1.5 pl-2.5 pr-3 sm:pl-3 sm:pr-4 py-1.5 sm:py-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Wallet className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold hidden sm:inline">Payments</span>
              </Link>
            )}

            <button
              aria-label={open ? 'Close mobile navigation' : 'Open mobile navigation'}
              aria-expanded={open}
              className="lg:hidden p-1.5 sm:p-2.5 rounded-full hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <X className="w-[18px] h-[18px] sm:w-5 sm:h-5" aria-hidden="true" /> : <Menu className="w-[18px] h-[18px] sm:w-5 sm:h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2 — Categories mega menu + primary nav (desktop) */}
      <div className="hidden lg:block border-t border-border/70 bg-white/50">
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8">
          <div className="flex items-center gap-1 h-[52px]" ref={megaRef}>
            <div className="relative">
              <button
                onClick={() => setMega((m) => !m)}
                aria-expanded={mega}
                aria-haspopup="menu"
                className={`flex items-center gap-2 pl-4 pr-3.5 py-2 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  mega ? 'brand-gradient text-white shadow-md' : 'text-foreground hover:bg-secondary'
                }`}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                Categories
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${mega ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {mega && (
                <div className="absolute left-0 top-[calc(100%+10px)] w-[720px] animate-mega-in">
                  <div className="bg-white rounded-3xl border border-border shadow-[0_30px_70px_-20px_rgba(108,59,255,0.28)] p-6" role="menu">
                    {headerCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-1 py-2">No categories to show yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                        {headerCategories.map((c) => (
                          <CategoryMegaNode key={resolveKey(c)} category={c} depth={0} onNavigate={() => setMega(false)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-border mx-2" aria-hidden="true" />

            <nav className="flex items-center gap-1" aria-label="Primary">
              {navLinks.map((l) => (
                <Link
                  key={l.name}
                  to={l.to}
                  aria-current={loc.pathname === l.to ? 'page' : undefined}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    loc.pathname === l.to ? 'text-primary bg-secondary' : 'text-foreground/75 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {l.name}
                </Link>
              ))}
            </nav>

            {!isSellerUser && (
              <Link
                to="/become-a-seller"
                className="ml-auto text-sm font-semibold text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:underline"
              >
                Become a Seller
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE PANEL */}
      {open && (
        <div className="lg:hidden bg-white border-t border-border px-5 py-5 space-y-4 animate-mega-in max-h-[80vh] overflow-y-auto">
          <form onSubmit={submitSearch} role="search" className="flex items-center gap-2 w-full bg-secondary/60 rounded-full px-4 py-3 border border-border">
            <Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              aria-label="Search"
              placeholder="Search for anything…"
              className="bg-transparent outline-none text-sm w-full"
            />
          </form>

          {(recent.length > 0 || POPULAR_SEARCHES.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {(recent.length ? recent : POPULAR_SEARCHES).slice(0, 5).map((t) => (
                <button key={t} type="button" onClick={() => goSearch(t)} className="text-xs px-3 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary transition-colors">
                  {t}
                </button>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">Categories</p>
            <div className="grid grid-cols-2 gap-2">
              {headerCategories.map((c) => {
                const Icon = resolveIcon(c);
                const color = resolveColor(c);
                const name = resolveName(c);
                const slug = resolveSlug(c);
                return (
                  <Link
                    key={resolveKey(c)}
                    to={`/category/${slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-secondary transition-colors"
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-xl shrink-0" style={{ background: `${color}18`, color }}>
                      <Icon className="w-4.5 h-4.5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium truncate">{name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.name} to={l.to} className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary">
                {l.name}
              </Link>
            ))}
            {!isSellerUser && (
              <Link to="/become-a-seller" className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-secondary">
                Become a Seller
              </Link>
            )}
          </div>

          {!isUserLoggedIn && (
            <div className="border-t border-border pt-4 flex items-center gap-3">
              <Link to="/login" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-secondary text-primary text-sm font-semibold">
                <User className="w-4 h-4" aria-hidden="true" /> Sign in
              </Link>
            </div>
          )}

          {isUserLoggedIn && !isSellerUser && (
            <div className="border-t border-border pt-4 flex items-center gap-3">
              <Link to="/wallet" aria-label="Payments wallet" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-secondary text-primary text-sm font-semibold">
                <Wallet className="w-5 h-5" aria-hidden="true" /> Payments
              </Link>
            </div>
          )}
        </div>
      )}

      {isSellerUser && (
        <>
          <button
            type="button"
            onClick={openSellerDrawer}
            aria-label="Open seller sidebar"
            className="fixed right-4 top-[calc(64px+20px)] bottom-auto z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-white shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:top-auto sm:bottom-6"
          >
            <LucideStore className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline text-sm font-semibold">Seller workspace</span>
          </button>

          <SellerSidebar
            open={showSellerDrawer}
            closing={sellerDrawerClosing}
            onClose={closeSellerDrawer}
            seller={seller}
            walletBalance={sellerWalletBalance}
            notificationsCount={sellerNotificationsCount}
            onLogout={logoutSeller}
          />
        </>
      )}
    </header>
  );
};

export default Header;
