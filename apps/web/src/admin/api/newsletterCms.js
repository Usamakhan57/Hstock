import { createSingleton } from './db';
import { seedNewsletterCms } from './seedData';

const resource = createSingleton('newsletter_cms', seedNewsletterCms);

export const getNewsletterCms = resource.get;
export const updateNewsletterCms = resource.update;
