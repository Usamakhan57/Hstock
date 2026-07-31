import { get, put } from '../../lib/apiClient';

function mergeSettings({ systemConfig, platformConfig, commissionConfig } = {}) {
  const system = systemConfig || {};
  const platform = platformConfig || {};
  const commission = commissionConfig || {};
  return {
    storeName: platform.storeName || 'ApnaStore',
    storeEmail: platform.storeEmail || platform.supportEmail || '',
    storePhone: platform.storePhone || '',
    address: platform.address || '',
    currency: system.currency || 'USD',
    timezone: platform.timezone || 'UTC',
    logo: platform.logo || '',
    taxRatePercent: platform.taxRatePercent ?? 0,
    flatShippingFee: system.sellerRegistrationFee ?? 0,
    emailNewOrder: platform.emailNewOrder !== false,
    emailLowStock: platform.emailLowStock !== false,
    emailNewReview: !!platform.emailNewReview,
    maintenanceMode: !!platform.maintenanceMode,
    shippingZones: platform.shippingZones || [],
    shippingMethods: platform.shippingMethods || [],
    taxRules: platform.taxRules || [],
    platformFeePercent: commission.defaultPercent ?? 10,
    commissionRules: (commission.categoryRules || []).map((rule, i) => ({
      id: rule.id || `comm-${i}`,
      scope: rule.categoryName || rule.scope || 'All Categories',
      rate: rule.percent ?? rule.rate ?? 15,
    })),
    _raw: { system, platform, commission },
  };
}

export const getSettings = async () => {
  const { data } = await get('/config');
  return mergeSettings(data);
};

export const updateSettings = async (form) => {
  const platformPayload = {
    storeName: form.storeName,
    storeEmail: form.storeEmail,
    storePhone: form.storePhone,
    address: form.address,
    timezone: form.timezone,
    logo: form.logo,
    maintenanceMode: form.maintenanceMode,
    emailNewOrder: form.emailNewOrder,
    emailLowStock: form.emailLowStock,
    emailNewReview: form.emailNewReview,
    taxRatePercent: Number(form.taxRatePercent) || 0,
    shippingZones: form.shippingZones,
    shippingMethods: form.shippingMethods,
    taxRules: form.taxRules,
  };

  const systemPayload = {
    currency: form.currency,
    sellerRegistrationFee: Number(form.flatShippingFee) || 0,
  };

  const commissionPayload = {
    defaultPercent: Number(form.platformFeePercent) || 10,
    categoryRules: (form.commissionRules || []).map((rule) => ({
      categoryName: rule.scope,
      percent: Number(rule.rate) || 0,
    })),
  };

  await Promise.all([
    put('/config/platform', platformPayload),
    put('/config/system', systemPayload),
    put('/config/commission', commissionPayload),
  ]);

  return getSettings();
};
