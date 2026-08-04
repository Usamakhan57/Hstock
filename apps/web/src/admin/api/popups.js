import { createCmsList } from './cmsBackend';
import { seedPopups } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.POPUPS, seedPopups);

export const getPopups = resource.getAll;
export const getPopup = resource.getById;
export const createPopup = resource.create;
export const updatePopup = resource.update;
export const deletePopup = resource.remove;
export const deletePopups = resource.removeMany;
