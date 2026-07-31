import { createResource } from './db';
import { seedBlogPosts } from './seedData';

const resource = createResource('blog_posts', seedBlogPosts);

/**
 * All business rules for posts (soft delete, revisioning, bulk actions)
 * live here — the one service layer both admin pages and the public
 * blogService import from. UI components never touch localStorage or
 * the createResource() cache directly; they only ever call functions
 * exported from this file (or the public wrapper in services/blog).
 */

export const getBlogPost = resource.getById;

/** Non-trashed posts — what "All Posts" and the public site should ever see. */
export async function getBlogPosts() {
  const all = await resource.getAll();
  return all.filter((p) => !p.deletedAt);
}

/** Trashed posts only — backs the Trash page. */
export async function getTrashedBlogPosts() {
  const all = await resource.getAll();
  return all.filter((p) => !!p.deletedAt);
}

export async function createBlogPost(item) {
  return resource.create({
    version: 1,
    modifiedBy: item.modifiedBy || 'Admin',
    deletedAt: null,
    ...item,
  });
}

/**
 * Every update stamps a new version + who made it (`modifiedBy` is
 * passed in by the caller, which knows the logged-in admin; this layer
 * just records whatever it is told). `updatedAt` doubles as "Last
 * Modified" and is stamped automatically by the underlying resource.
 */
export async function updateBlogPost(id, patch) {
  const current = await resource.getById(id);
  const nextVersion = (current?.version || 1) + 1;
  return resource.update(id, {
    modifiedBy: patch.modifiedBy || 'Admin',
    ...patch,
    version: patch.version ?? nextVersion,
  });
}

/** Duplicate a post as a new draft — used by the All Posts row action. */
export async function duplicateBlogPost(id) {
  const original = await resource.getById(id);
  if (!original) throw new Error('Post not found');
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, ...rest } = original;
  return createBlogPost({
    ...rest,
    title: `${original.title} (Copy)`,
    slug: `${original.slug}-copy-${Date.now().toString(36)}`,
    status: 'draft',
    publishedAt: null,
    views: 0,
    deletedAt: null,
  });
}

// --- Soft delete / Trash -------------------------------------------------

export async function trashBlogPost(id) {
  return resource.update(id, { deletedAt: new Date().toISOString() });
}

export async function restoreBlogPost(id) {
  return resource.update(id, { deletedAt: null });
}

export async function permanentlyDeleteBlogPost(id) {
  return resource.remove(id);
}

// --- Bulk actions ---------------------------------------------------------
// Orchestration lives here (not in page components) so BlogPostsList and
// BlogTrash only ever call one function per action.

export async function bulkSetBlogPostsStatus(ids, status) {
  return Promise.all(ids.map((id) => updateBlogPost(id, {
    status,
    ...(status === 'published' ? { publishedAt: new Date().toISOString() } : {}),
  })));
}

export async function bulkTrashBlogPosts(ids) {
  return Promise.all(ids.map(trashBlogPost));
}

export async function bulkRestoreBlogPosts(ids) {
  return Promise.all(ids.map(restoreBlogPost));
}

export async function bulkPermanentlyDeleteBlogPosts(ids) {
  return resource.removeMany(ids);
}

export async function bulkDuplicateBlogPosts(ids) {
  return Promise.all(ids.map(duplicateBlogPost));
}
