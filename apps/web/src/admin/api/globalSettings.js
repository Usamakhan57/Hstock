import { createSingleton } from './db';
import { seedGlobalSettings } from './seedData';

const resource = createSingleton('global_settings', seedGlobalSettings);

export const getGlobalSettings = resource.get;
export const updateGlobalSettings = resource.update;
