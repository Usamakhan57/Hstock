import { createResource } from './db';
import { seedCustomers } from './seedData';

const resource = createResource('customers', seedCustomers);

export const getCustomers = resource.getAll;
export const getCustomer = resource.getById;
export const createCustomer = resource.create;
export const updateCustomer = resource.update;
export const deleteCustomer = resource.remove;
export const deleteCustomers = resource.removeMany;
