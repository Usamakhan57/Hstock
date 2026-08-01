import { get, patch } from '../../lib/apiClient';
import { mapSellerFromProfile } from './adminMappers';

function normalizeSeller(raw) {
  if (!raw) return null;
  const user = raw.user && typeof raw.user === 'object' ? raw.user : null;
  const mapped = mapSellerFromProfile(raw, user);
  return {
    ...mapped,
    id: mapped.sellerProfileId || mapped.id,
    sellerProfileId: mapped.sellerProfileId || mapped.id,
    userId: mapped.userId || (user ? (user.id || user._id) : null),
    commissionRate: raw.commissionRate ?? mapped.commissionRate ?? 15,
    approvedAt: raw.approvedAt || null,
    approvedBy: raw.approvedBy || null,
  };
}

export const getSellers = async ({ page = 1, limit = 100, status, search } = {}) => {
  const params = { page, limit };
  if (status) params.status = status;
  if (search) params.search = search;
  const { data } = await get('/users/sellers', { params });
  return (Array.isArray(data) ? data : []).map(normalizeSeller);
};

export const getSeller = async (id) => {
  const { data } = await get(`/users/sellers/${id}`);
  return normalizeSeller(data?.seller || data);
};

export const createSeller = async () => {
  throw new Error('Creating sellers via admin API is not supported.');
};

export const updateSeller = async (id, payload = {}) => {
  // Prefer SellerProfile id; API also accepts user id as a fallback.
  let sellerId = id;
  try {
    const current = await getSeller(id);
    sellerId = current?.sellerProfileId || current?.id || id;
  } catch {
    sellerId = id;
  }

  const body = {};
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.verified !== undefined) body.verified = payload.verified;
  if (payload.verificationStatus !== undefined) body.verificationStatus = payload.verificationStatus;
  if (payload.commissionRate !== undefined) body.commissionRate = Number(payload.commissionRate);
  if (payload.storeName !== undefined) body.storeName = payload.storeName;
  if (payload.ownerName !== undefined) body.ownerName = payload.ownerName;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (payload.specialty !== undefined) body.specialty = payload.specialty;
  if (payload.bio !== undefined) body.bio = payload.bio;

  const { data } = await patch(`/users/sellers/${sellerId}`, body);
  return normalizeSeller(data?.seller || data);
};

export const deleteSeller = async () => {
  throw new Error('Deleting sellers via admin API is not supported.');
};

export const deleteSellers = async () => {
  throw new Error('Bulk delete is not supported.');
};

export const approveSeller = (id) => updateSeller(id, { status: 'approved', verified: true });
export const rejectSeller = (id) => updateSeller(id, { status: 'rejected' });
export const suspendSeller = (id) => updateSeller(id, { status: 'suspended' });
export const reinstateSeller = (id) => updateSeller(id, { status: 'approved', verified: true });
