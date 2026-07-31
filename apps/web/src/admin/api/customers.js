import { usersApi } from '../../services/usersApi';
import { mapCustomer } from './adminMappers';

export const getCustomers = async () => {
  const { items } = await usersApi.adminList({ role: 'buyer', limit: 100 });
  return items.map((u) => mapCustomer(u));
};

export const getCustomer = async (id) => {
  const { items } = await usersApi.adminList({ role: 'buyer', limit: 100 });
  const user = items.find((u) => String(u.id) === String(id));
  return user ? mapCustomer(user) : null;
};

export const createCustomer = async (payload) => {
  throw new Error('Creating customers via admin API is not supported.');
};

export const updateCustomer = async (id, payload) => {
  const body = {};
  if (payload.status) body.status = payload.status === 'suspended' ? 'suspended' : 'active';
  const { user } = await usersApi.adminUpdate(id, body);
  return mapCustomer(user);
};

export const deleteCustomer = async () => {
  throw new Error('Deleting customers via admin API is not supported.');
};

export const deleteCustomers = async () => {
  throw new Error('Bulk delete is not supported.');
};
