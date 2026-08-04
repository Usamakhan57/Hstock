import { createCmsSingleton } from './cmsBackend';
import { seedContactSettings } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsSingleton(CMS_KEYS.CONTACT, seedContactSettings);

export const getContactSettings = resource.get;
export const updateContactSettings = resource.update;
