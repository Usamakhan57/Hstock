import React from 'react';

const STYLES = {
  // Generic
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-gray-100 text-gray-500',
  published: 'bg-emerald-100 text-emerald-700',
  // Orders / Sellers
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-amber-100 text-amber-700',
  // Reviews / Coupons / Banners / Users
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
  scheduled: 'bg-blue-100 text-blue-700',
  invited: 'bg-blue-100 text-blue-700',
  suspended: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700',
  // Inventory
  in_stock: 'bg-emerald-100 text-emerald-700',
  low_stock: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-700',
};

const LABELS = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

const StatusBadge = ({ status }) => {
  const style = STYLES[status] || 'bg-gray-100 text-gray-600';
  const label = LABELS[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
