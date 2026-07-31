import { createSingleton } from './db';
import { seedSettings } from './seedData';

const resource = createSingleton('settings', seedSettings);

export const getSettings = resource.get;
export const updateSettings = resource.update;
