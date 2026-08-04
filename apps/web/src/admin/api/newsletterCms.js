import { createCmsSingleton } from './cmsBackend';
import { seedNewsletterCms } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsSingleton(CMS_KEYS.NEWSLETTER, seedNewsletterCms);

export const getNewsletterCms = resource.get;
export const updateNewsletterCms = resource.update;
