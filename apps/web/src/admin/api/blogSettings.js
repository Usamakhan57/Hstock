import { createSingleton } from './db';
import { seedBlogSettings } from './seedData';

const resource = createSingleton('blog_settings', seedBlogSettings);

export const getBlogSettings = resource.get;
export const updateBlogSettings = resource.update;
