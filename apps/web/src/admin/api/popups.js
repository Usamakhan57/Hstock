import { createResource } from './db';
import { seedPopups } from './seedData';

const resource = createResource('popups', seedPopups);

export const getPopups = resource.getAll;
export const updatePopup = resource.update;
