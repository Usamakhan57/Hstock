import { createResource } from './db';
import { seedOrders } from './seedData';

const resource = createResource('orders', seedOrders);

export const getOrders = resource.getAll;
export const getOrder = resource.getById;
export const createOrder = resource.create;
export const updateOrder = resource.update;
export const deleteOrder = resource.remove;
