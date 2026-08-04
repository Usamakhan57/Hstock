import { createCmsList } from './cmsBackend';
import { seedTestimonials } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.TESTIMONIALS, seedTestimonials);

export const getTestimonials = resource.getAll;
export const getTestimonial = resource.getById;
export const createTestimonial = resource.create;
export const updateTestimonial = resource.update;
export const deleteTestimonial = resource.remove;
export const deleteTestimonials = resource.removeMany;
