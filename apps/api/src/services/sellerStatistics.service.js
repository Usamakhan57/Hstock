/**
 * Single source of truth for seller sales statistics.
 *
 * Total Sales matches Seller Dashboard `summarizeSellerStats.grossSales`:
 * sum of order.totalAmount for every order that is not cancelled or expired.
 */
import mongoose from 'mongoose';
import { Order } from '../models/index.js';
import { ORDER_STATUS } from '../constants/statuses.js';

/** Statuses excluded from Total Sales (same as web sellerAnalytics.isActiveSale). */
export const TOTAL_SALES_EXCLUDED_STATUSES = Object.freeze([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.EXPIRED,
]);

export function isCountableTotalSale(status) {
  return Boolean(status) && !TOTAL_SALES_EXCLUDED_STATUSES.includes(status);
}

/**
 * Pure helper — same rules as dashboard client aggregation.
 * Accepts either API orders (`totalAmount`) or mapped web orders (`amount`).
 */
export function computeTotalSalesFromOrders(orders = []) {
  const sum = (orders || [])
    .filter((o) => isCountableTotalSale(o?.status))
    .reduce((acc, o) => acc + Number(o.totalAmount ?? o.amount ?? 0), 0);
  return Number(sum.toFixed(2));
}

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  const raw = String(id);
  if (!mongoose.Types.ObjectId.isValid(raw)) return null;
  return new mongoose.Types.ObjectId(raw);
}

function emptyStats() {
  return {
    totalSales: 0,
    ordersCount: 0,
    productsSold: 0,
    completedOrders: 0,
  };
}

function normalizeAggRow(row) {
  if (!row) return emptyStats();
  return {
    totalSales: Number(Number(row.totalSales || 0).toFixed(2)),
    ordersCount: Number(row.ordersCount || 0),
    productsSold: Number(row.productsSold || 0),
    completedOrders: Number(row.completedOrders || 0),
  };
}

/**
 * Live order aggregation for one seller profile.
 * @param {string|import('mongoose').Types.ObjectId} sellerProfileId
 */
export async function getSellerStatistics(sellerProfileId) {
  const sellerOid = toObjectId(sellerProfileId);
  if (!sellerOid) return emptyStats();

  const [row] = await Order.aggregate([
    {
      $match: {
        seller: sellerOid,
        status: { $nin: [...TOTAL_SALES_EXCLUDED_STATUSES] },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        ordersCount: { $sum: 1 },
        productsSold: { $sum: '$quantity' },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', ORDER_STATUS.COMPLETED] }, 1, 0],
          },
        },
      },
    },
  ]);

  return normalizeAggRow(row);
}

/**
 * Batch statistics for public seller lists / featured stores / cards.
 * @param {Array<string|import('mongoose').Types.ObjectId>} sellerProfileIds
 * @returns {Promise<Map<string, ReturnType<typeof emptyStats>>>}
 */
export async function getSellerStatisticsMap(sellerProfileIds = []) {
  const oids = [...new Set(
    (sellerProfileIds || [])
      .map(toObjectId)
      .filter(Boolean)
      .map((id) => String(id)),
  )].map((id) => new mongoose.Types.ObjectId(id));

  const map = new Map();
  if (!oids.length) return map;

  const rows = await Order.aggregate([
    {
      $match: {
        seller: { $in: oids },
        status: { $nin: [...TOTAL_SALES_EXCLUDED_STATUSES] },
      },
    },
    {
      $group: {
        _id: '$seller',
        totalSales: { $sum: '$totalAmount' },
        ordersCount: { $sum: 1 },
        productsSold: { $sum: '$quantity' },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', ORDER_STATUS.COMPLETED] }, 1, 0],
          },
        },
      },
    },
  ]);

  for (const oid of oids) {
    map.set(String(oid), emptyStats());
  }
  for (const row of rows) {
    map.set(String(row._id), normalizeAggRow(row));
  }
  return map;
}

export default {
  TOTAL_SALES_EXCLUDED_STATUSES,
  isCountableTotalSale,
  computeTotalSalesFromOrders,
  getSellerStatistics,
  getSellerStatisticsMap,
};
