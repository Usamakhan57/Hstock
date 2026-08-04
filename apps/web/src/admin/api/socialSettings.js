import { createCmsSingleton } from './cmsBackend';
import { seedSocialSettings } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsSingleton(CMS_KEYS.SOCIAL, seedSocialSettings);

export const getSocialSettings = resource.get;
export const updateSocialSettings = resource.update;
