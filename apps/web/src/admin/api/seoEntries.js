import { createCmsList } from './cmsBackend';
import { seedSeoEntries } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.SEO, seedSeoEntries);

export const getSeoEntries = resource.getAll;
export const getSeoEntry = resource.getById;
export const createSeoEntry = resource.create;
export const updateSeoEntry = resource.update;
export const deleteSeoEntry = resource.remove;
export const deleteSeoEntries = resource.removeMany;
