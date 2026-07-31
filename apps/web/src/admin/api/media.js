import { createResource } from './db';
import { seedMedia } from './seedData';

const resource = createResource('media', seedMedia);

export const getMedia = resource.getAll;
export const uploadMedia = resource.create;
export const deleteMedia = resource.remove;
export const deleteMediaMany = resource.removeMany;
