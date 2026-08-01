/**
 * Marketplace sold-count label.
 * Uses real sales data when present; falls back to "New" when unavailable.
 */
export function formatSoldCount(value) {
  if (value == null || value === '') return 'New';
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 'New';
  if (n >= 1000) {
    const k = n / 1000;
    const formatted = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, '');
    return `${formatted}k Sold`;
  }
  return `${Math.round(n)} Sold`;
}

export default formatSoldCount;
