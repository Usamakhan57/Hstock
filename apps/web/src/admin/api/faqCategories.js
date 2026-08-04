import { createCmsList } from './cmsBackend';
import { seedFaqCategories } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.FAQ_CATEGORIES, seedFaqCategories);

export const getFaqCategories = resource.getAll;
export const getFaqCategory = resource.getById;
export const createFaqCategory = resource.create;
export const updateFaqCategory = resource.update;
export const deleteFaqCategory = resource.remove;
export const deleteFaqCategories = resource.removeMany;
