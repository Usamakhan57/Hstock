import { createResource } from './db';
import { seedCoupons } from './seedData';

const resource = createResource('coupons', seedCoupons);

export const getCoupons = resource.getAll;
export const getCoupon = resource.getById;
export const createCoupon = resource.create;
export const updateCoupon = resource.update;
export const deleteCoupon = resource.remove;
export const deleteCoupons = resource.removeMany;
