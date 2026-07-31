import { createResource } from './db';
import { seedBlogAuthors } from './seedData';

const resource = createResource('blog_authors', seedBlogAuthors);

export const getBlogAuthors = resource.getAll;
export const getBlogAuthor = resource.getById;
export const createBlogAuthor = resource.create;
export const updateBlogAuthor = resource.update;
export const deleteBlogAuthor = resource.remove;
export const deleteBlogAuthors = resource.removeMany;
