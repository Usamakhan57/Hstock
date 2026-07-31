import { createSingleton } from './db';
import { seedContactSettings } from './seedData';

const resource = createSingleton('contact_settings', seedContactSettings);

export const getContactSettings = resource.get;
export const updateContactSettings = resource.update;
