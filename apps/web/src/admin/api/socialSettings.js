import { createSingleton } from './db';
import { seedSocialSettings } from './seedData';

const resource = createSingleton('social_settings', seedSocialSettings);

export const getSocialSettings = resource.get;
export const updateSocialSettings = resource.update;
