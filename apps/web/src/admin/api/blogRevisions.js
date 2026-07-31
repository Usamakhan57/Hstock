import { createResource } from './db';
import { seedBlogRevisions } from './seedData';

/**
 * Revisions are future-ready: the resource and read functions exist now
 * so the "Version History" panel in BlogPostForm has somewhere real to
 * read from. There is no write path yet — a real backend would append a
 * revision automatically on every save; recording that here would mean
 * building diffing/snapshotting mock logic that is thrown away the
 * moment a real API exists, so the data model and UI are prepared
 * without building throwaway snapshot logic.
 */
const resource = createResource('blog_post_revisions', seedBlogRevisions);

export const getBlogRevisions = resource.getAll;

/** All revisions for one post, oldest first. */
export async function getBlogRevisionsForPost(postId) {
  const all = await resource.getAll();
  return all.filter((r) => r.postId === postId).sort((a, b) => a.version - b.version);
}
