import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Pencil,
  Trash2,
  Package,
  TrendingUp,
  Sparkles,
  Upload,
  Eye,
  Copy,
  PauseCircle,
  PlayCircle,
  BarChart3,
} from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';
import ConfirmDeleteDialog from '../../../admin/components/ConfirmDeleteDialog';
import Pagination from './Pagination';
import SellerProductsOverview from './SellerProductsOverview';
import { getSellerProducts, deleteSellerProduct, updateSellerProduct } from '../api/sellerProducts';
import { useToast } from '../../../hooks/use-toast';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'live', label: 'Live' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const SellerProductsTab = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [deliveryType, setDeliveryType] = useState('all');
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSellerProducts()
      .then((data) => {
        if (!alive) return;
        setProducts(data);
      })
      .catch((err) => {
        if (!alive) return;
        setProducts([]);
        toast({ title: 'Could not load products', description: err.message, variant: 'destructive' });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [toast]);

  useEffect(() => {
    const fromUrl = searchParams.get('status');
    if (fromUrl) setStatus(fromUrl);
  }, [searchParams]);

  const categoryOptions = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products],
  );

  const filtered = useMemo(() => {
    let rows = products;
    if (category !== 'all') rows = rows.filter((p) => p.category === category);
    if (deliveryType !== 'all') rows = rows.filter((p) => (p.deliveryType || 'automatic') === deliveryType);
    if (status === 'out_of_stock') {
      rows = rows.filter((p) => p.stockType !== 'unlimited' && Number(p.stock || 0) <= 0);
    } else if (status !== 'all') {
      rows = rows.filter((p) => p.status === status);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((p) => (
        (p.title || '').toLowerCase().includes(q)
        || (p.category || '').toLowerCase().includes(q)
        || (p.slug || '').toLowerCase().includes(q)
        || (p.deliveryType || '').toLowerCase().includes(q)
        || String(p.id || '').toLowerCase().includes(q)
      ));
    }
    return rows;
  }, [products, category, status, query, deliveryType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, category, status, deliveryType]);

  const applyStatusFilter = (next) => {
    const value = next === 'all' ? 'all' : next;
    setStatus(value);
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteSellerProduct(pendingDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast({ title: 'Listing removed', description: pendingDelete.title });
      setPendingDelete(null);
    } catch (err) {
      toast({ title: 'Could not delete listing', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const togglePause = async (product) => {
    const nextStatus = product.status === 'live' ? 'disabled' : 'live';
    setBusyId(product.id);
    try {
      const updated = await updateSellerProduct(product.id, { ...product, status: nextStatus }, { publish: nextStatus === 'live' });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...updated, status: nextStatus } : p)));
      toast({
        title: nextStatus === 'live' ? 'Listing resumed' : 'Listing paused',
        description: product.title,
      });
    } catch (err) {
      toast({ title: 'Could not update listing', description: err.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const duplicateHint = (product) => {
    toast({
      title: 'Duplicate from editor',
      description: `Open “${product.title}”, then save as a new draft with a new title.`,
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">My Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">• {products.length} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/seller/analytics"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100"
          >
            <BarChart3 className="h-4 w-4" /> Rank
          </Link>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      <SellerProductsOverview products={products} onFilter={applyStatusFilter} />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your products by title, category, status, delivery, or SKU…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full rounded-full lg:w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={applyStatusFilter}>
          <SelectTrigger className="w-full rounded-full lg:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deliveryType} onValueChange={setDeliveryType}>
          <SelectTrigger className="w-full rounded-full lg:w-[160px]"><SelectValue placeholder="Delivery" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Delivery</SelectItem>
            <SelectItem value="automatic">Instant</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-full border border-border bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setView('grid')} aria-label="Grid view" className={`rounded-full p-2 ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setView('list')} aria-label="List view" className={`rounded-full p-2 ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading your listings…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-border bg-white">
          <EmptyState
            icon={Package}
            title={products.length === 0 ? 'No listings yet' : 'No listings match your filters'}
            description={products.length === 0 ? 'Publish your first listing to start selling on ApnaStore.' : 'Try another search or status filter.'}
            action={products.length === 0 ? <Link to="/seller/products/new" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">Create Listing</Link> : null}
          />
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageRows.map((p) => {
              const outOfStock = p.stockType !== 'unlimited' && Number(p.stock || 0) <= 0;
              return (
                <div key={p.id} className="overflow-hidden rounded-[1.35rem] border border-border bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-secondary">
                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-muted-foreground">No preview</div>}
                    <div className="absolute left-3 top-3"><StatusBadge status={p.status} /></div>
                    {outOfStock ? (
                      <div className="absolute inset-x-0 bottom-0 bg-red-600 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white">
                        Out of stock — upload accounts
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-sm font-bold text-foreground">{p.title}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">{p.category || 'Uncategorized'}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${outOfStock ? 'bg-red-50 text-red-600' : 'bg-secondary'}`}>
                        {outOfStock ? 'Out of stock' : `${p.stock ?? 0} in stock`}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                        <TrendingUp className="h-3 w-3 text-sky-600" /> {p.metrics?.views || 0}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-lg font-black text-foreground">${Number(p.price).toFixed(2)}</p>
                        {p.salePrice != null ? (
                          <p className="text-xs text-muted-foreground">Sale ${Number(p.salePrice).toFixed(2)}</p>
                        ) : null}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <Sparkles className="h-3 w-3" />
                        {p.deliveryType === 'manual' ? 'Manual' : 'Instant'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Sold {p.soldCount || 0}</span>
                      <span>Rev ${Number(p.metrics?.revenue || 0).toFixed(2)}</span>
                      {p.rating != null ? <span>★ {Number(p.rating).toFixed(1)}</span> : null}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link to={`/seller/products/${p.id}/edit`} className="inline-flex items-center justify-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <Link to={`/seller/upload-accounts/${p.id}`} className="inline-flex items-center justify-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary">
                        <Upload className="h-3.5 w-3.5" /> Inventory
                      </Link>
                      <button type="button" onClick={() => togglePause(p)} disabled={busyId === p.id} className="inline-flex items-center justify-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-60">
                        {p.status === 'live' ? <><PauseCircle className="h-3.5 w-3.5" /> Pause</> : <><PlayCircle className="h-3.5 w-3.5" /> Resume</>}
                      </button>
                      <button type="button" onClick={() => setPendingDelete(p)} className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => duplicateHint(p)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <Link to={`/product/${p.slug || p.id}`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <>
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Listing</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Price</th>
                    <th className="px-5 py-3 font-semibold">Stock</th>
                    <th className="px-5 py-3 font-semibold">Sold</th>
                    <th className="px-5 py-3 font-semibold">Delivery</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={p.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover bg-secondary" />
                          <div>
                            <p className="font-semibold">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.metrics?.views || 0} views · ${Number(p.metrics?.revenue || 0).toFixed(2)} rev</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.category}</td>
                      <td className="px-5 py-3.5">${Number(p.price).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.stock ?? 0}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.soldCount || 0}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.deliveryType === 'manual' ? 'Manual' : 'Instant'}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/seller/products/${p.id}/edit`} className="rounded-lg p-1.5 transition hover:bg-secondary"><Pencil className="h-4 w-4" /></Link>
                          <Link to={`/seller/upload-accounts/${p.id}`} className="rounded-lg p-1.5 transition hover:bg-secondary"><Upload className="h-4 w-4" /></Link>
                          <button type="button" onClick={() => setPendingDelete(p)} className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDeleteDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)} title="Delete this listing?" description={pendingDelete ? `"${pendingDelete.title}" will be removed from your storefront.` : ''} onConfirm={confirmDelete} busy={deleting} />
    </div>
  );
};

export default SellerProductsTab;
