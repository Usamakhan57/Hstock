import { createResource } from './db';
import { seedReviews } from './seedData';

const resource = createResource('reviews', seedReviews);

export const getReviews = resource.getAll;
export const getReview = resource.getById;
export const updateReview = resource.update;
export const deleteReview = resource.remove;
export const deleteReviews = resource.removeMany;
