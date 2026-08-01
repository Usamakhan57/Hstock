import { get, post } from '../lib/apiClient';

export const buyerWalletApi = {
  async getWallet() {
    const { data } = await get('/wallet');
    return data;
  },

  async getHistory(params = {}) {
    const { data, meta } = await get('/wallet/history', { params });
    return { items: data || [], meta };
  },

  async deposit({ amount, toCurrency, network, urlReturn, urlSuccess }) {
    const { data } = await post('/wallet/deposit', {
      amount: Number(amount),
      toCurrency,
      network,
      urlReturn,
      urlSuccess,
    });
    return data;
  },

  async topup({ amount, toCurrency, network, urlReturn, urlSuccess }) {
    const { data } = await post('/wallet/topup', {
      amount: Number(amount),
      toCurrency,
      network,
      urlReturn,
      urlSuccess,
    });
    return data;
  },
};

export default buyerWalletApi;
