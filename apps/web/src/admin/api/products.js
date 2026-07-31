import { createResource } from './db';
import { seedProducts } from './seedData';

const resource = createResource('products', seedProducts);

export const getProducts = resource.getAll;
export const getProduct = resource.getById;
export const createProduct = resource.create;
export const updateProduct = resource.update;
export const deleteProduct = resource.remove;
export const deleteProducts = resource.removeMany;
