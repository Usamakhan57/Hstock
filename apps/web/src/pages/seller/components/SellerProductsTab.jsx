import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, List as ListIcon, Plus, Pencil, Trash2, Package, TrendingUp, Sparkles } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';
import ConfirmDeleteDialog from '../../../admin/components/ConfirmDeleteDialog';
import Pagination from './Pagination';
import SellerProductsOverview from './SellerProductsOverview';
import { getSellerProducts, deleteSellerProduct } from '../api/sellerProducts';
import { useToast } from '../../../hooks/use-toast';

const PAGE_SIZE = 6;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'live', label: 'Live' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const SellerProductsTab = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
  }, []);

  const categoryOptions = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products]);

  const filtered = useMemo(() => {
    let rows = products;
    if (category !== 'all') rows = rows.filter((p) => p.category === category);
    if (status !== 'all') rows = rows.filter((p) => p.status === status);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((p) => (p.title || '').toLowerCase().includes(q));
    }
    return rows;
  }, [products, category, status, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, category, status]);

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

  return (
    <div>
      <SellerProductsOverview products={products} />

      <div className="mb-6 rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Listings</p>
            <h3 className="mt-1 text-xl font-black">Manage your HStock inventory</h3>
            <p className="mt-1 text-sm text-muted-foreground">Launch new products, track stock, and feature your best sellers from one streamlined control center.</p>
          </div>
          <Link to="/seller/products/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95">
            <Plus className="h-4 w-4" /> Create Listing
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full rounded-full lg:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full rounded-full lg:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-1">
          <button onClick={() => setView('grid')} aria-label="Grid view" className={`rounded-full p-2 ${view === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView('list')} aria-label="List view" className={`rounded-full p-2 ${view === 'list' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}>
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading your listings…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-border bg-white">
          <EmptyState icon={Package} title={products.length === 0 ? 'No listings yet' : 'No listings match your filters'} description={products.length === 0 ? 'Publish your first listing to start selling on HStock.' : 'Try another search or status filter.'} action={products.length === 0 ? <Link to="/seller/products/new" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">Create Listing</Link> : null} />
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageRows.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-secondary">
                  {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-muted-foreground">No preview</div>}
                  <div className="absolute left-3 top-3 flex gap-2">
                    <StatusBadge status={p.status} />
                    {p.promoted ? <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">Promoted</span> : null}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{p.listingType || 'listing'}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-black">${Number(p.price).toFixed(2)}</span>
                    <span className="text-muted-foreground">{p.stock ?? 0} in stock</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><TrendingUp className="h-3 w-3" /> {p.metrics?.views || 0} views</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><Sparkles className="h-3 w-3" /> {p.promoted ? 'Featured' : 'Standard'}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Link to={`/seller/products/${p.id}/edit`} className="flex-1 rounded-full border border-border px-3 py-2 text-center text-xs font-semibold transition hover:bg-secondary">Edit</Link>
                    <button onClick={() => setPendingDelete(p)} className="rounded-full border border-border p-2 text-red-600 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <>
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Listing</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Price</th>
                    <th className="px-5 py-3 font-semibold">Stock</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={p.thumbnail} alt={p.title} className="h-10 w-10 rounded-lg object-cover bg-secondary" />
                          <div>
                            <p className="font-semibold">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.listingType || 'Listing'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.category}</td>
                      <td className="px-5 py-3.5">${Number(p.price).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.stock ?? 0}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/seller/products/${p.id}/edit`} className="rounded-lg p-1.5 transition hover:bg-secondary"><Pencil className="h-4 w-4" /></Link>
                          <button onClick={() => setPendingDelete(p)} className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
