import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Package,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import {
  getSellerProduct,
  getSellerInventory,
  updateSellerProduct,
  replaceSellerInventory,
} from '../api/sellerProducts';
import InventoryImportSection from './InventoryImportSection';
import {
  countReadyInventory,
  getDeliveryLabel,
  isInventoryRequired,
  isManualDelivery,
} from '../lib/sellerDelivery';

function statusTone(status) {
  if (status === 'available') return 'bg-emerald-100 text-emerald-700';
  if (status === 'reserved') return 'bg-amber-100 text-amber-700';
  if (status === 'sold') return 'bg-slate-100 text-slate-600';
  return 'bg-red-100 text-red-700';
}

const UploadAccountsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [importMode, setImportMode] = useState('append');

  const loadInventory = useCallback(async () => {
    if (!productId) return;
    const data = await getSellerInventory(productId, { includeSold: true });
    setInventory(data);
  }, [productId]);

  useEffect(() => {
    if (!productId) return undefined;
    let mounted = true;
    setLoading(true);
    Promise.all([
      getSellerProduct(productId),
      getSellerInventory(productId, { includeSold: true }).catch(() => null),
    ])
      .then(([item, inv]) => {
        if (!mounted) return;
        setProduct(item);
        setInventory(inv);
        if (item && isManualDelivery(item.deliveryType)) {
          toast({
            title: 'Inventory import not required',
            description: 'Manual Delivery products manage stock without account imports.',
          });
          navigate(`/seller/products/${productId}/edit`, { replace: true });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [productId, navigate, toast]);

  const items = useMemo(() => (Array.isArray(inventory?.items) ? inventory.items : []), [inventory]);
  const summary = inventory?.summary || { available: 0, reserved: 0, sold: 0, total: 0 };

  const filteredItems = useMemo(() => {
    let rows = items;
    if (statusFilter !== 'all') {
      rows = rows.filter((item) => item.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((item) => {
        const email = item.emailNormalized || item.credentialsMasked?.email || '';
        const fields = Object.values(item.credentialsMasked || {}).join(' ');
        return (
          String(email).toLowerCase().includes(q)
          || String(fields).toLowerCase().includes(q)
          || String(item.id).toLowerCase().includes(q)
          || String(item.status).toLowerCase().includes(q)
        );
      });
    }
    return rows;
  }, [items, query, statusFilter]);

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const copyText = async (value, label = 'Credential') => {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: 'Copy failed', description: 'Clipboard access was blocked.', variant: 'destructive' });
    }
  };

  const exportCsv = () => {
    const header = ['index', 'id', 'status', 'email', 'createdAt', 'soldAt'];
    const lines = [header.join(',')];
    filteredItems.forEach((item, index) => {
      const email = item.emailNormalized || item.credentialsMasked?.email || '';
      lines.push([
        index + 1,
        item.id,
        item.status,
        `"${String(email).replace(/"/g, '""')}"`,
        item.createdAt || '',
        item.soldAt || '',
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `inventory-${productId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export ready', description: `${filteredItems.length} rows downloaded.` });
  };

  const saveImport = async ({ publish = false } = {}) => {
    if (!productId || !product) return;

    if (isInventoryRequired(product.deliveryType) && countReadyInventory(accounts) < 1) {
      toast({
        title: 'Inventory required',
        description: 'Import and validate at least one account before uploading.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const liveStock = countReadyInventory(accounts);
      await replaceSellerInventory(productId, accounts, {
        sourceFormat: 'paste',
        mode: importMode === 'append' ? 'append' : 'replace_available',
      });
      if (publish) {
        await updateSellerProduct(productId, {
          ...product,
          status: 'live',
          stock: liveStock,
          stockType: 'limited',
          inventoryType: 'tracked',
        }, { publish: true });
      }
      setAccounts([]);
      setSelectedIds([]);
      await loadInventory();
      toast({
        title: publish ? 'Product is live' : 'Inventory updated',
        description: importMode === 'append'
          ? `${liveStock} accounts appended to available stock.`
          : `${liveStock} accounts replaced available stock (sold rows preserved).`,
      });
      if (publish) navigate('/seller/products');
    } catch (error) {
      toast({ title: 'Could not update inventory', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const clearUnsoldHint = () => {
    toast({
      title: 'Clear unsold via Replace',
      description: 'Import a new list and choose “Replace available”. Sold and reserved rows stay intact.',
    });
    setImportMode('replace');
    document.getElementById('inventory-import-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearSoldHint = () => {
    toast({
      title: 'Sold history is retained',
      description: 'Sold inventory stays linked to order delivery history and cannot be purged from this panel.',
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6">
        <div className="rounded-[1.5rem] border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
          Loading inventory tools…
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6">
        <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Product not found.</p>
          <Link to="/seller/products" className="mt-3 inline-flex text-sm font-semibold text-primary">Back to products</Link>
        </div>
      </div>
    );
  }

  if (isManualDelivery(product.deliveryType)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 px-4 py-8 sm:px-6 lg:px-10">
      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/seller/products"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary hover:opacity-80"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Products
            </Link>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Inventory</p>
            <h1 className="mt-1 line-clamp-2 text-2xl font-black tracking-tight text-foreground">
              {product.title || 'Product'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {getDeliveryLabel(product.deliveryType)} · Stock counter {summary.available} available
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearUnsoldHint}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              <Wand2 className="h-4 w-4" /> Clear Unsold
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Available', summary.available, 'text-emerald-600'],
          ['Reserved', summary.reserved, 'text-amber-600'],
          ['Sold', summary.sold, 'text-slate-600'],
          ['Total', summary.total, 'text-foreground'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-[1.25rem] border border-border bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email, password, or any field…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold outline-none"
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
          <button
            type="button"
            onClick={clearSoldHint}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary"
          >
            Clear sold
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-4 py-10 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">No inventory rows match</p>
              <p className="mt-1 text-sm text-muted-foreground">Upload accounts below to stock this listing.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const email = item.emailNormalized || item.credentialsMasked?.email || '—';
              return (
                <div key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-primary"># {index + 1}</span>
                        <p className="truncate text-sm font-bold uppercase tracking-wide text-sky-800">
                          {product.title}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="truncate font-mono text-sm text-foreground">{email}</p>
                        <button
                          type="button"
                          onClick={() => copyText(email, 'Email')}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label="Copy email"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        className="h-4 w-4"
                      />
                      Select
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusTone(item.status)}`}>
                        {item.status === 'available' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                        {item.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewItem(item)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toast({
                            title: 'Delete via replace',
                            description: 'Live credentials are encrypted. Remove available rows by importing a replacement list.',
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedIds.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
            {selectedIds.length} selected — use Export for a filtered CSV, or Replace available to rebuild unsold stock from a new import.
          </div>
        ) : null}
      </div>

      <div id="inventory-import-panel" className="space-y-4">
        <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-foreground">Upload more / Import</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Append adds to available stock. Replace clears previous available rows first.
              </p>
            </div>
            <div className="flex rounded-full border border-border bg-secondary/40 p-1">
              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${importMode === 'append' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
              >
                Append
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${importMode === 'replace' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
              >
                Replace available
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Stock validation
            </div>
            <p className="mt-1">Support for duplicate detection, bulk draft actions, and live counters.</p>
          </div>
        </div>

        <InventoryImportSection
          productId={productId}
          accounts={accounts}
          onAccountsChange={setAccounts}
        />
      </div>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-end gap-3 rounded-[1.5rem] border border-border bg-white/95 p-4 shadow-lg backdrop-blur lg:bottom-6">
        <Link
          to={`/seller/products/${productId}/edit`}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
        >
          Edit product
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={() => saveImport({ publish: false })}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60"
        >
          <UploadCloud className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save stock'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => saveImport({ publish: true })}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {saving ? 'Publishing…' : 'Save stock & go live'}
        </button>
      </div>

      {viewItem ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setViewItem(null)}>
          <div
            className="w-full max-w-lg rounded-[1.5rem] border border-border bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-foreground">Account credentials</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Masked values from the inventory API. Full secrets are delivered only to buyers after purchase.
            </p>
            <div className="mt-4 space-y-2">
              {Object.entries(viewItem.credentialsMasked || { email: viewItem.emailNormalized || '—' }).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{key}</p>
                    <p className="truncate font-mono text-sm text-foreground">{String(value)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(value, key)}
                    className="rounded-lg p-1.5 hover:bg-white"
                    aria-label={`Copy ${key}`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setViewItem(null)}
              className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UploadAccountsPage;
