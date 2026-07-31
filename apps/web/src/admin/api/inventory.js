/**
 * Inventory is deliberately NOT a separate product-duplicating resource
 * — it reads/writes the same `products` records (stock, lowStockThreshold)
 * so Products and Inventory can never drift out of sync, while still
 * giving Inventory its own focused list/adjust API surface. A real
 * backend might instead model this as its own MongoDB collection with a
 * productId reference — either way, only this file changes.
 */
import { createResource } from './db';
import { getProducts, updateProduct } from './products';
import { seedStockLog } from './seedData';

const stockLogResource = createResource('stock_log', seedStockLog);

export async function getInventory() {
  const products = await getProducts();
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    image: p.thumbnail,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    status: p.stock === 0 ? 'out_of_stock' : p.stock <= p.lowStockThreshold ? 'low_stock' : 'in_stock',
  }));
}

export async function adjustStock(productId, delta, reason) {
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) throw new Error('Product not found');

  const nextStock = Math.max(0, product.stock + delta);
  await updateProduct(productId, { stock: nextStock });
  await stockLogResource.create({
    productId,
    productTitle: product.title,
    delta,
    resultingStock: nextStock,
    reason: reason || (delta > 0 ? 'Restock' : 'Manual adjustment'),
  });

  return nextStock;
}

export const getStockLog = stockLogResource.getAll;
