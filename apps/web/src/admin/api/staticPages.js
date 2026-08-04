import { createCmsList } from './cmsBackend';
import { seedStaticPages } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.STATIC_PAGES, seedStaticPages);

export const getStaticPages = resource.getAll;
export const getStaticPage = resource.getById;
export const createStaticPage = resource.create;
export const updateStaticPage = resource.update;
export const deleteStaticPage = resource.remove;
export const deleteStaticPages = resource.removeMany;
