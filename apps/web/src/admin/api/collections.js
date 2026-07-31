import { createResource } from './db';
import { seedCollections } from './seedData';

const resource = createResource('collections', seedCollections);

export const getCollections = resource.getAll;
export const getCollection = resource.getById;
export const createCollection = resource.create;
export const updateCollection = resource.update;
export const deleteCollection = resource.remove;
export const deleteCollections = resource.removeMany;
