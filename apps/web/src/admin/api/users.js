import { createResource } from './db';
import { seedUsers } from './seedData';

const resource = createResource('users', seedUsers);

export const getUsers = resource.getAll;
export const getUser = resource.getById;
export const createUser = resource.create;
export const updateUser = resource.update;
export const deleteUser = resource.remove;
