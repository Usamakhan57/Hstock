import { get, post } from '../../lib/apiClient';
import { mapAdminLedgerEntry, fetchAllPages } from './adminMappers';

export const getWalletLedger = async (params = {}) => {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/wallet/ledger', { params: { ...params, page, limit } });
    return { items: data, meta };
  });
  return items.map(mapAdminLedgerEntry);
};

export const getSellerWallet = async (sellerId) => {
  const { data } = await get(`/wallet/seller/${sellerId}`);
  return data;
};

export const adjustWallet = async ({ sellerId, amount, direction, reason }) => {
  const { data } = await post('/wallet/adjust', { sellerId, amount, direction, reason });
  return data;
};
