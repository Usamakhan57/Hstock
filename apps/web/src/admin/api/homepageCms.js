import { createCmsSingleton } from './cmsBackend';
import { seedHomepageCms } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsSingleton(CMS_KEYS.HOMEPAGE, seedHomepageCms);

export const getHomepageCms = resource.get;
export const updateHomepageCms = resource.update;
