import { createResource } from './db';
import { seedNavMenus } from './seedData';

const resource = createResource('nav_menus', seedNavMenus);

export const getNavMenus = resource.getAll;
export const getNavMenu = resource.getById;
export const createNavMenu = resource.create;
export const updateNavMenu = resource.update;
export const deleteNavMenu = resource.remove;
