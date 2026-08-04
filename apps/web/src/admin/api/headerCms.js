import { createCmsSingleton } from './cmsBackend';
import { seedHeaderCms } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsSingleton(CMS_KEYS.HEADER, seedHeaderCms);

export const getHeaderCms = resource.get;
export const updateHeaderCms = resource.update;
