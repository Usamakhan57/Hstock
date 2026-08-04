import { createCmsList } from './cmsBackend';
import { seedNavMenus } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.NAV_MENUS, seedNavMenus);

export const getNavMenus = resource.getAll;
export const getNavMenu = resource.getById;
export const createNavMenu = resource.create;
export const updateNavMenu = resource.update;
export const deleteNavMenu = resource.remove;
export const deleteNavMenus = resource.removeMany;
