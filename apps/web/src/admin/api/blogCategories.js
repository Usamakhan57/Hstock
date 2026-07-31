import { createResource } from './db';
import { seedBlogCategories } from './seedData';

const resource = createResource('blog_categories', seedBlogCategories);

export const getBlogCategories = resource.getAll;
export const getBlogCategory = resource.getById;
export const createBlogCategory = resource.create;
export const updateBlogCategory = resource.update;
export const deleteBlogCategory = resource.remove;
export const deleteBlogCategories = resource.removeMany;
