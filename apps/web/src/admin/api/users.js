import { usersApi } from '../../services/usersApi';
import { mapAdminUser } from './adminMappers';

const ROLE_MAP = {
  Admin: 'admin',
  Editor: 'editor',
  Support: 'support',
  'Super Admin': 'super_admin',
};

function toApiRole(role) {
  if (!role) return 'editor';
  return ROLE_MAP[role] || String(role).toLowerCase();
}

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
  const { user } = await usersApi.adminInvite({
    name: payload.name,
    email: payload.email,
    role: toApiRole(payload.role),
  });
  return mapAdminUser(user);
};

export const updateUser = async (id, payload) => {
  const body = {};
  if (payload.status) body.status = payload.status;
  if (payload.name) body.name = payload.name;
  if (payload.role) {
    body.roles = [toApiRole(payload.role)];
  }
  const { user } = await usersApi.adminUpdate(id, body);
  return mapAdminUser(user);
};

export const deleteUser = async () => {
  throw new Error('Deleting users via API is not supported.');
};
