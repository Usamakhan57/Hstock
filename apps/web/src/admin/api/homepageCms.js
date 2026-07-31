import { createSingleton } from './db';
import { seedHomepageCms } from './seedData';

const resource = createSingleton('homepage_cms', seedHomepageCms);

export const getHomepageCms = resource.get;
export const updateHomepageCms = resource.update;
