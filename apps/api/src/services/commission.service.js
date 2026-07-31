import { getCommissionConfig } from './config.service.js';
import { calculateCommission, roundMoney } from '../helpers/money.helper.js';

/**
 * Resolve commission percent from MongoDB rules.
 * Priority: seller+category rule > seller rule > category rule > defaultPercent
 * Never hardcode the default — always read from CommissionConfig.
 */
export async function resolveCommissionPercent({
  sellerId = null,
  categoryId = null,
  config = null,
} = {}) {
  const commissionConfig = config || await getCommissionConfig();
  if (!commissionConfig || commissionConfig.isActive === false) {
    return Number(commissionConfig?.defaultPercent ?? 0);
  }

  const sellerStr = sellerId ? String(sellerId) : null;
  const categoryStr = categoryId ? String(categoryId) : null;

  const candidates = [];

  for (const rule of commissionConfig.sellerRules || []) {
    const ruleSeller = rule.sellerId ? String(rule.sellerId) : null;
    const ruleCategory = rule.categoryId ? String(rule.categoryId) : null;
    if (sellerStr && ruleSeller === sellerStr) {
      if (!ruleCategory || (categoryStr && ruleCategory === categoryStr)) {
        candidates.push({
          percent: rule.percent,
          priority: (rule.priority || 0) + (ruleCategory ? 1000 : 500),
          source: 'seller',
        });
      }
    }
  }

  for (const rule of commissionConfig.categoryRules || []) {
    const ruleCategory = rule.categoryId ? String(rule.categoryId) : null;
    const ruleSeller = rule.sellerId ? String(rule.sellerId) : null;
    if (categoryStr && ruleCategory === categoryStr) {
      if (!ruleSeller || (sellerStr && ruleSeller === sellerStr)) {
        candidates.push({
          percent: rule.percent,
          priority: (rule.priority || 0) + (ruleSeller ? 800 : 100),
          source: 'category',
        });
      }
    }
  }

  if (candidates.length) {
    candidates.sort((a, b) => b.priority - a.priority);
    return Number(candidates[0].percent);
  }

  return Number(commissionConfig.defaultPercent);
}

export async function computeOrderCommission(amount, { sellerId, categoryId } = {}) {
  const percent = await resolveCommissionPercent({ sellerId, categoryId });
  const split = calculateCommission(amount, percent);
  return {
    ...split,
    amount: roundMoney(amount),
  };
}

export default {
  resolveCommissionPercent,
  computeOrderCommission,
};
