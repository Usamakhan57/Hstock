import { createSingleton } from './db';
import { seedFooterCms } from './seedData';

const resource = createSingleton('footer_cms', seedFooterCms);

export const getFooterCms = resource.get;
export const updateFooterCms = resource.update;
