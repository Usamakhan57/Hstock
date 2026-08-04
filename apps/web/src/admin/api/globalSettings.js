import { createCmsSingleton } from './cmsBackend';
import { seedGlobalSettings } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsSingleton(CMS_KEYS.GLOBAL, seedGlobalSettings);

export const getGlobalSettings = resource.get;
export const updateGlobalSettings = resource.update;
