import { createSingleton } from './db';
import { seedHeaderCms } from './seedData';

const resource = createSingleton('header_cms', seedHeaderCms);

export const getHeaderCms = resource.get;
export const updateHeaderCms = resource.update;
