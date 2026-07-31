import { get, patch } from '../../lib/apiClient';
import { usersApi } from '../../services/usersApi';
import { mapAdminUser } from './adminMappers';

export const getUsers = async (params = {}) => {
  const { items } = await usersApi.adminList({ ...params, limit: params.limit || 100 });
  return items
    .filter((u) => (u.roles || []).some((r) => ['admin', 'super_admin', 'editor', 'support'].includes(r)))
    .map(mapAdminUser);
};

export const getUser = async (id) => {
  const { items } = await usersApi.adminList({ search: id, limit: 1 });
  const user = items.find((u) => String(u.id) === String(id));
  return user ? mapAdminUser(user) : null;
};

export const createUser = async (payload) => {
  throw new Error('Inviting admin users via API is not supported yet.');
};

export const updateUser = async (id, payload) => {
  const body = {};
  if (payload.status) body.status = payload.status;
  if (payload.name) body.name = payload.name;
  if (payload.role) {
    const roleMap = {
      Admin: 'admin',
      Editor: 'editor',
      Support: 'support',
      'Super Admin': 'super_admin',
    };
    body.roles = [roleMap[payload.role] || payload.role.toLowerCase()];
  }
  const { user } = await usersApi.adminUpdate(id, body);
  return mapAdminUser(user);
};

export const deleteUser = async () => {
  throw new Error('Deleting users via API is not supported.');
};
