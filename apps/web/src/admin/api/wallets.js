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

export const getBuyerWallet = async (buyerId) => {
  const { data } = await get(`/wallet/buyer/${buyerId}`);
  return data;
};

export const adjustBuyerWallet = async ({ buyerId, amount, direction, reason, type }) => {
  const { data } = await post(`/wallet/buyer/${buyerId}/adjust`, {
    amount,
    direction,
    reason,
    type,
  });
  return data;
};

export const freezeBuyerWallet = async (buyerId, reason) => {
  const { data } = await post(`/wallet/buyer/${buyerId}/freeze`, { reason });
  return data;
};

export const unfreezeBuyerWallet = async (buyerId) => {
  const { data } = await post(`/wallet/buyer/${buyerId}/unfreeze`, {});
  return data;
};

export const listBuyerWalletTransactions = async (params = {}) => {
  const { data, meta } = await get('/wallet/buyer/transactions', { params });
  return { items: data || [], meta };
};

export const exportBuyerWalletCsvUrl = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
  return `${base}/wallet/buyer/transactions/export${qs ? `?${qs}` : ''}`;
};
