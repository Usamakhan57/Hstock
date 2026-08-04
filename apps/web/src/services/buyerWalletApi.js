import { get, post } from '../lib/apiClient';
import { clearRequestCache } from '../lib/requestCache';

export const buyerWalletApi = {
  async getWallet() {
    const { data } = await get('/wallet');
    return data;
  },

  async getHistory(params = {}) {
    const { data, meta } = await get('/wallet/history', { params });
    return { items: data || [], meta };
  },

  async listDeposits(params = {}) {
    const { data, meta } = await get('/wallet/deposits', { params });
    return { items: data || [], meta };
  },

  async refreshDeposit(depositId) {
    const { data } = await post(`/wallet/deposits/${depositId}/refresh`, {});
    clearRequestCache('wallet');
    clearRequestCache('wallet-tx');
    return data;
  },

  async deposit({
    amount,
    toCurrency,
    network,
    urlReturn,
    urlSuccess,
    creditToSellerWallet = false,
  }) {
    const { data } = await post('/wallet/deposit', {
      amount: Number(amount),
      toCurrency,
      network,
      urlReturn,
      urlSuccess,
      ...(creditToSellerWallet ? { creditToSellerWallet: true } : {}),
    });
    clearRequestCache('wallet');
    clearRequestCache('wallet-tx');
    return data;
  },

  async topup({
    amount,
    toCurrency,
    network,
    urlReturn,
    urlSuccess,
    creditToSellerWallet = false,
  }) {
    const { data } = await post('/wallet/topup', {
      amount: Number(amount),
      toCurrency,
      network,
      urlReturn,
      urlSuccess,
      ...(creditToSellerWallet ? { creditToSellerWallet: true } : {}),
    });
    clearRequestCache('wallet');
    clearRequestCache('wallet-tx');
    return data;
  },
};

export default buyerWalletApi;
