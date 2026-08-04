import { createCmsList } from './cmsBackend';
import { seedHeroSlides } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.HERO_SLIDES, seedHeroSlides);

export const getHeroSlides = resource.getAll;
export const getHeroSlide = resource.getById;
export const createHeroSlide = resource.create;
export const updateHeroSlide = resource.update;
export const deleteHeroSlide = resource.remove;
export const deleteHeroSlides = resource.removeMany;
