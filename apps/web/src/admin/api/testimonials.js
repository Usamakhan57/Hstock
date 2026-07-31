import { createResource } from './db';
import { seedTestimonials } from './seedData';

const resource = createResource('testimonials', seedTestimonials);

export const getTestimonials = resource.getAll;
export const createTestimonial = resource.create;
export const updateTestimonial = resource.update;
export const deleteTestimonial = resource.remove;
