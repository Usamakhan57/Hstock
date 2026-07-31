import { get } from '../../lib/apiClient';

export const getDashboard = async () => {
  const { data } = await get('/admin/dashboard');
  return data;
};

export const getAnalytics = async ({ days = 30 } = {}) => {
  const { data } = await get('/admin/analytics', { params: { days } });
  return data;
};

export const getOcrQueue = async ({ page = 1, limit = 30 } = {}) => {
  const { data, meta } = await get('/admin/ocr-queue', { params: { page, limit } });
  return {
    items: Array.isArray(data) ? data : [],
    replacements: meta?.replacements || [],
    meta,
  };
};

export const getSystemHealth = async () => {
  const { data } = await get('/admin/system-health');
  return data;
};
