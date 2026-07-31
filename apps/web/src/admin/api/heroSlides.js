import { createResource } from './db';
import { seedHeroSlides } from './seedData';

const resource = createResource('hero_slides', seedHeroSlides);

export const getHeroSlides = resource.getAll;
export const getHeroSlide = resource.getById;
export const createHeroSlide = resource.create;
export const updateHeroSlide = resource.update;
export const deleteHeroSlide = resource.remove;
