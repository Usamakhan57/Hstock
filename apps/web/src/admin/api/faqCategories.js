import { createResource } from './db';
import { seedFaqCategories } from './seedData';

const resource = createResource('faq_categories', seedFaqCategories);

export const getFaqCategories = resource.getAll;
export const createFaqCategory = resource.create;
export const updateFaqCategory = resource.update;
export const deleteFaqCategory = resource.remove;
