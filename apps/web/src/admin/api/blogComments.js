import { createResource } from './db';
import { seedBlogComments } from './seedData';

/**
 * Comments are future-ready: the resource, CRUD functions, and admin page
 * all exist now so that wiring up the frontend comment box later is a
 * pure add-on — no admin architecture to build at that point. Nothing
 * on the live Blog page posts comments yet.
 */
const resource = createResource('blog_comments', seedBlogComments);

export const getBlogComments = resource.getAll;
export const getBlogComment = resource.getById;
export const createBlogComment = resource.create;
export const updateBlogComment = resource.update;
export const deleteBlogComment = resource.remove;
export const deleteBlogComments = resource.removeMany;
