import { createResource } from './db';
import { seedFaqs } from './seedData';

const resource = createResource('faqs', seedFaqs);

export const getFaqs = resource.getAll;
export const createFaq = resource.create;
export const updateFaq = resource.update;
export const deleteFaq = resource.remove;
