import { createCmsList } from './cmsBackend';
import { seedFaqs } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.FAQS, seedFaqs);

export const getFaqs = resource.getAll;
export const getFaq = resource.getById;
export const createFaq = resource.create;
export const updateFaq = resource.update;
export const deleteFaq = resource.remove;
export const deleteFaqs = resource.removeMany;
