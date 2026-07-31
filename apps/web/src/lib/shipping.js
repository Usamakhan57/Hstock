/**
 * Shared helpers for digital-only marketplace data.
 *
 * ApnaStore products never require physical fulfillment, so these helpers now
 * return empty access information for digital items and zero-cost totals.
 */

export const isPhysicalItem = () => false;

export const getItemShippingInfo = () => null;

export const getCartShippingTotal = () => 0;

export const cartHasPhysicalItems = () => false;
export const cartIsAllDigital = (items = []) => items.length > 0 && items.every(() => true);
