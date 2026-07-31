import { createResource } from './db';
import { seedStaticPages } from './seedData';

const resource = createResource('static_pages', seedStaticPages);

export const getStaticPages = resource.getAll;
export const getStaticPage = resource.getById;
export const createStaticPage = resource.create;
export const updateStaticPage = resource.update;
export const deleteStaticPage = resource.remove;
