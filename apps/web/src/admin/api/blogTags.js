import { createResource } from './db';
import { seedBlogTags } from './seedData';

const resource = createResource('blog_tags', seedBlogTags);

export const getBlogTags = resource.getAll;
export const getBlogTag = resource.getById;
export const createBlogTag = resource.create;
export const updateBlogTag = resource.update;
export const deleteBlogTag = resource.remove;
export const deleteBlogTags = resource.removeMany;
