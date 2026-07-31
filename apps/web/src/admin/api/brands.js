import { createResource } from './db';
import { seedBrands } from './seedData';

const resource = createResource('brands', seedBrands);

export const getBrands = resource.getAll;
export const getBrand = resource.getById;
export const createBrand = resource.create;
export const updateBrand = resource.update;
export const deleteBrand = resource.remove;
export const deleteBrands = resource.removeMany;
