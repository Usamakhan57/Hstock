import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Star, UploadCloud, EyeOff, Check, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import { getProducts, deleteProduct, deleteProducts, updateProduct, approveProduct, rejectProduct } from '../../api/products';
import { getCategories } from '../../api/categories';
import { useToast } from '../../../hooks/use-toast';

const ProductsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getProducts(), getCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '—';

  const togglePublish = async (row) => {
    const next = row.status === 'active' ? 'draft' : 'active';
    await updateProduct(row.id, { status: next });
    toast({ title: next === 'active' ? 'Product published' : 'Product unpublished', description: row.title });
    load();
  };

  const toggleFeatured = async (row) => {
    await updateProduct(row.id, { featured: !row.featured });
    toast({ title: !row.featured ? 'Product featured' : 'Product unfeatured', description: row.title });
    load();
  };

  const runModeration = async (fn, row, message) => {
    await fn(row.id);
    toast({ title: message, description: row.title });
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteProduct(deleteTarget.id);
    toast({ title: 'Product deleted', description: deleteTarget.title });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} products in your catalog`}
        actions={
          <button
            onClick={() => navigate('/admin/products/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={products}
        searchKeys={['title', 'sku']}
        filters={[
          { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Published' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }] },
          { key: 'categoryId', label: 'Category', options: categories.map((c) => ({ value: c.id, label: c.name })) },
        ]}
        bulkActions={[
          {
            label: 'Delete',
            destructive: true,
            onClick: async (ids) => { await deleteProducts(ids); toast({ title: `${ids.length} products deleted` }); load(); },
          },
        ]}
        onRowClick={(row) => navigate(`/admin/products/${row.id}/edit`)}
        columns={[
          {
            key: 'title',
            label: 'Product',
            render: (row) => (
              <div className="flex items-center gap-3 min-w-[220px]">
                <img src={row.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate flex items-center gap-1.5">
                    {row.title}
                    {row.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.sku}</p>
                </div>
              </div>
            ),
          },
          { key: 'categoryId', label: 'Category', render: (row) => categoryName(row.categoryId) },
          {
            key: 'price',
            label: 'Price',
            render: (row) => row.salePrice
              ? (<span><span className="line-through text-muted-foreground mr-1">${row.price.toFixed(2)}</span><span className="font-medium text-emerald-700">${row.salePrice.toFixed(2)}</span></span>)
              : `$${row.price.toFixed(2)}`,
          },
          {
            key: 'stock',
            label: 'Stock',
            render: (row) => (
              <span className={row.stock === 0 ? 'text-red-600 font-medium' : row.stock <= row.lowStockThreshold ? 'text-amber-600 font-medium' : ''}>
                {row.stock}
              </span>
            ),
          },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status === 'active' ? 'published' : row.status} /> },
        ]}
        rowActions={(row) => [
          ...(row.approvalStatus === 'pending' ? [
            { label: 'Approve', icon: Check, onClick: () => runModeration(approveProduct, row, 'Product approved') },
            { label: 'Reject', icon: X, onClick: () => runModeration(rejectProduct, row, 'Product rejected') },
          ] : []),
          { label: 'Edit', icon: Pencil, onClick: () => navigate(`/admin/products/${row.id}/edit`) },
          { label: 'View on Store', icon: Eye, onClick: () => window.open(`/product/${row.id}`, '_blank') },
          { separator: true },
          { label: row.status === 'active' ? 'Unpublish' : 'Publish', icon: row.status === 'active' ? EyeOff : UploadCloud, onClick: () => togglePublish(row) },
          { label: row.featured ? 'Unfeature' : 'Feature', icon: Star, onClick: () => toggleFeatured(row) },
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ title: 'No products yet', description: 'Add your first product to start selling.' }}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this product?"
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default ProductsList;
