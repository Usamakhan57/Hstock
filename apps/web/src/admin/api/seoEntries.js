import { createResource } from './db';
import { seedSeoEntries } from './seedData';

const resource = createResource('seo_entries', seedSeoEntries);

export const getSeoEntries = resource.getAll;
export const updateSeoEntry = resource.update;
