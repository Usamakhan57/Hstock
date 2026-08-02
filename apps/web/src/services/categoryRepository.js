/**
 * Storefront category repository — backed by backend catalog cache.
 * Keeps the previous sync helpers so Header/Category pages stay unchanged.
 */
import {
  Tag as TagIcon,
  Users, Globe2, Globe, Cloud, FileCode2, Smartphone, Bot, LayoutTemplate,
  GraduationCap, BookOpen, Terminal, Instagram, Facebook, Music2, Youtube, Twitter,
  Mail, Trophy, Sparkles, Server, Coins, Shield, BadgeCheck, Send, MessageCircle,
  Briefcase, Camera, Film, Puzzle, Monitor, Palette, Layers, NotebookPen,
} from 'lucide-react';
import {
  getCategoryTree, getRootCategories, getChildren, flattenCategories, getAncestors,
} from './categoryTree';
import { getCachedCategories, hydrateCatalog } from './catalogCache';
import { getProductCountByCategoryId } from './productRepository';

const ACCENT_COLORS = ['#6C3BFF', '#8F63FF', '#FF4FD8'];

const ICON_MAP = {
  Users, Globe2, Globe, Cloud, FileCode2, Smartphone, Bot, LayoutTemplate,
  GraduationCap, BookOpen, Terminal, Instagram, Facebook, Music2, Youtube, Twitter,
  Mail, Trophy, Sparkles, Server, Coins, Shield, BadgeCheck, Send, MessageCircle,
  Briefcase, Camera, Film, Puzzle, Monitor, Palette, Layers, NotebookPen,
  Tag: TagIcon,
};

function decorate(cat, index = 0, productCounts = {}) {
  const id = cat.id || cat._id;
  const count = productCounts[id] || cat.productCount || 0;
  return {
    ...cat,
    id,
    parentId: cat.parentId || cat.parent || null,
    icon: typeof cat.icon === 'string'
      ? (ICON_MAP[cat.icon] || TagIcon)
      : (cat.icon || TagIcon),
    color: cat.color || ACCENT_COLORS[index % ACCENT_COLORS.length],
    productCount: count,
  };
}

function list() {
  const productCounts = getProductCountByCategoryId();
  return getCachedCategories().map((cat, index) => decorate(cat, index, productCounts));
}

export function getStorefrontCategories() {
  return list();
}

export function getCategoryBySlug(slug) {
  return list().find((c) => c.slug === slug) || null;
}

export function getCategoryById(id) {
  return list().find((c) => String(c.id) === String(id)) || null;
}

export function resolveCategoryName(id) {
  return getCategoryById(id)?.name || null;
}

export function resolveCategorySlug(id) {
  return getCategoryById(id)?.slug || null;
}

export function getStorefrontCategoryTree() {
  return getCategoryTree(list());
}

export function getCategoryTreeForStorefront() {
  return getStorefrontCategoryTree();
}

export function getRootStorefrontCategories() {
  return getRootCategories(list());
}

/**
 * Homepage services — active categories marked for homepage, sorted A–Z.
 * Falls back to all active categories when none are flagged yet.
 */
export function getHomepageCategories() {
  const all = list().filter((c) => (c.status || 'active') === 'active');
  const flagged = all.filter((c) => c.showOnHomepage);
  const source = flagged.length ? flagged : all;
  return [...source].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

export function getStorefrontCategoryChildren(parentId = null) {
  return getChildren(list(), parentId);
}

export function flattenStorefrontCategories() {
  return flattenCategories(getStorefrontCategoryTree());
}

export function getCategoryAncestors(categoryOrId) {
  const id = typeof categoryOrId === 'object' ? categoryOrId?.id : categoryOrId;
  return getAncestors(list(), id);
}

export function searchCategories(query, limit = 8) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return [];
  return list()
    .filter((c) => c.name?.toLowerCase().includes(needle) || c.slug?.toLowerCase().includes(needle))
    .slice(0, limit);
}

/** Async helper for pages that want a guaranteed fresh load. */
export async function loadCategories({ force = false } = {}) {
  await hydrateCatalog({ force });
  return getStorefrontCategories();
}

export default {
  getStorefrontCategories,
  getCategoryBySlug,
  getCategoryById,
  resolveCategoryName,
  resolveCategorySlug,
  getStorefrontCategoryTree,
  getCategoryTreeForStorefront,
  getRootStorefrontCategories,
  getHomepageCategories,
  getStorefrontCategoryChildren,
  flattenStorefrontCategories,
  getCategoryAncestors,
  searchCategories,
  loadCategories,
};
