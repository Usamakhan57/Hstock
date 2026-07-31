import { patch } from '../../lib/apiClient';
import { usersApi } from '../../services/usersApi';
import { get } from '../../lib/apiClient';
import { mapSellerFromProfile, fetchAllPages } from './adminMappers';

async function loadSellerProfiles() {
  const byUserId = new Map();
  const bySellerId = new Map();

  const products = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/products', { params: { page, limit } });
    return { items: data, meta };
  });

  products.forEach((product) => {
    const seller = product.seller;
    if (!seller || typeof seller !== 'object') return;
    const mapped = mapSellerFromProfile(seller);
    if (mapped.id) {
      bySellerId.set(String(mapped.id), mapped);
      if (mapped.userId) byUserId.set(String(mapped.userId), mapped);
    }
  });

  const { items: users } = await usersApi.adminList({ role: 'seller', limit: 100 });
  users.forEach((user) => {
    if (!byUserId.has(String(user.id))) {
      const stub = mapSellerFromProfile(null, user);
      stub.status = 'pending';
      byUserId.set(String(user.id), stub);
      if (stub.sellerProfileId) bySellerId.set(String(stub.sellerProfileId), stub);
    }
  });

  const merged = new Map(bySellerId);
  byUserId.forEach((seller) => {
    if (seller.sellerProfileId) {
      merged.set(String(seller.sellerProfileId), seller);
    } else if (![...merged.values()].some((s) => String(s.userId) === String(seller.userId))) {
      merged.set(String(seller.userId), seller);
    }
  });

  return [...merged.values()];
}

export const getSellers = async () => loadSellerProfiles();

export const getSeller = async (id) => {
  const sellers = await loadSellerProfiles();
  return sellers.find((s) => String(s.id) === String(id) || String(s.userId) === String(id)) || null;
};

export const createSeller = async () => {
  throw new Error('Creating sellers via admin API is not supported.');
};

export const updateSeller = async (id, payload) => {
  const seller = await getSeller(id);
  const sellerId = seller?.sellerProfileId || seller?.id || id;
  const body = {};
  if (payload.status) body.status = payload.status;
  if (payload.verified !== undefined) body.verified = payload.verified;
  const { data } = await patch(`/users/sellers/${sellerId}`, body);
  return mapSellerFromProfile(data?.seller || data);
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
export const reinstateSeller = (id) => updateSeller(id, { status: 'approved' });
