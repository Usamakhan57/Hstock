import { createCmsList } from './cmsBackend';
import { seedBanners } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.BANNERS, seedBanners);

export const getBanners = resource.getAll;
export const getBanner = resource.getById;
export const createBanner = resource.create;
export const updateBanner = resource.update;
export const deleteBanner = resource.remove;
export const deleteBanners = resource.removeMany;
