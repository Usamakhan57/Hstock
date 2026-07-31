/**
 * Public-facing Blog service consumed by the storefront (BlogPage,
 * BlogPostPage). This is the ONLY place those pages should import blog
 * data from — never admin/api/blog* directly, and never hardcoded
 * arrays. It wraps the same mock resources the Admin Blog CMS writes
 * to, so a post/category/tag/author edited in Admin shows up here
 * immediately.
 *
 * WHY THIS SHAPE: when a real backend exists, this file is the one
 * place that changes — swap each function body for a `fetch('/api/blog/...')`
 * call with the same signature and return shape. BlogPage/BlogPostPage
 * do not change at all.
 */
import { getBlogPosts } from '../../admin/api/blogPosts';
import { getBlogCategories } from '../../admin/api/blogCategories';
import { getBlogTags } from '../../admin/api/blogTags';
import { getBlogAuthors } from '../../admin/api/blogAuthors';
import { getBlogSettings } from '../../admin/api/blogSettings';

const isPublished = (post) => post.status === 'published';
const byRecency = (a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);

/** All published posts, newest first. */
export async function getPublishedPosts() {
  const posts = await getBlogPosts();
  return posts.filter(isPublished).sort(byRecency);
}

/** Published posts flagged as Featured — powers the dynamic hero section. */
export async function getFeaturedPosts() {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.featured);
}

/** A single published post by slug, or null if missing/unpublished. */
export async function getPublishedPostBySlug(slug) {
  const posts = await getPublishedPosts();
  return posts.find((p) => p.slug === slug) || null;
}

/**
 * Related posts ranked by relevance: same category counts more than a
 * shared tag, posts can accumulate both, ties broken by recency.
 * Purely a function of the post list — safe to useMemo() in components.
 */
export function scoreRelatedPosts(post, candidates, limit = 3) {
  if (!post) return [];
  return candidates
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const sharedTags = (p.tags || []).filter((t) => (post.tags || []).includes(t)).length;
      const sameCategory = p.categoryId === post.categoryId ? 2 : 0;
      return { post: p, score: sameCategory + sharedTags };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || byRecency(a.post, b.post))
    .slice(0, limit)
    .map((entry) => entry.post);
}

/** Related posts for a given post — same category and/or shared tags. */
export async function getRelatedPosts(post, limit = 3) {
  const posts = await getPublishedPosts();
  return scoreRelatedPosts(post, posts, limit);
}

/** Enabled blog categories, in admin-defined order. */
export async function getActiveBlogCategories() {
  const categories = await getBlogCategories();
  return categories.filter((c) => c.status === 'active').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getAllBlogTags() {
  return getBlogTags();
}

export async function getAllBlogAuthors() {
  return getBlogAuthors();
}

/** Blog-wide settings (hero copy, toggles, pagination, labels, default SEO). */
export async function getPublicBlogSettings() {
  return getBlogSettings();
}

/** Resolve a category id to its display name; falls back gracefully. */
export function categoryName(categories, categoryId) {
  return categories.find((c) => c.id === categoryId)?.name || 'Uncategorized';
}

/** Resolve tag ids to display names. */
export function tagNames(tags, tagIds = []) {
  return tagIds.map((id) => tags.find((t) => t.id === id)?.name).filter(Boolean);
}

/** Resolve an author id to its full author record (name, avatar, bio, social links). */
export function authorById(authors, authorId) {
  return authors.find((a) => a.id === authorId) || null;
}
