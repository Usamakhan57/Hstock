import { createResource } from './db';
import { seedBanners } from './seedData';

const resource = createResource('banners', seedBanners);

export const getBanners = resource.getAll;
export const getBanner = resource.getById;
export const createBanner = resource.create;
export const updateBanner = resource.update;
export const deleteBanner = resource.remove;
export const deleteBanners = resource.removeMany;
