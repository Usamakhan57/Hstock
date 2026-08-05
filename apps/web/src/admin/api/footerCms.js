import { createCmsSingleton } from './cmsBackend';
import { seedFooterCms } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const DEFAULT_FOOTER = {
  ...seedFooterCms,
};

const resource = createCmsSingleton(CMS_KEYS.FOOTER, DEFAULT_FOOTER);

export const getFooterCms = resource.get;
export const updateFooterCms = resource.update;
