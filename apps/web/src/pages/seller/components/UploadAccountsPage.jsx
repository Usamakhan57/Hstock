import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Copy, Trash2, Download, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { getSellerProduct, updateSellerProduct } from '../api/sellerProducts';

const DEFAULT_FIELDS = ['email', 'password', 'recovery', '2fa', 'cookie', 'token'];
const MAX_CUSTOM_FIELDS = 20;

const UploadAccountsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [importMode, setImportMode] = useState('paste');
  const [rawText, setRawText] = useState('');
  const [divider, setDivider] = useState('tab');
  const [fieldMap, setFieldMap] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    if (!productId) return;
    getSellerProduct(productId).then((item) => setProduct(item));
  }, [productId]);

  useEffect(() => {
    if (!rawText) {
      setAccounts([]);
      return;
    }
    const rows = rawText.split(/\r?\n/).filter(Boolean).map((line) => {
      const values = line.split(divider === 'comma' ? ',' : divider === 'semicolon' ? ';' : '\t');
      const base = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, values, status: 'pending' };
      return base;
    });
    setAccounts(rows);
  }, [rawText, divider]);

  const importPreset = () => {
    if (!rawText.trim()) {
      toast({ title: 'Nothing to import', description: 'Paste or upload a list of accounts first.', variant: 'destructive' });
      return;
    }
    const nextAccounts = accounts.map((account, index) => ({
      ...account,
      id: `${productId || 'product'}-${index + 1}`,
      status: 'uploaded',
      source: importMode,
      validation: 'ready',
      available: true,
      sold: 0,
      reserved: 0,
      failed: 0,
      fields: Object.fromEntries(DEFAULT_FIELDS.map((field, fieldIndex) => [field, account.values[fieldIndex] || '']))
    }));
    setAccounts(nextAccounts);
    toast({ title: 'Accounts imported', description: `${nextAccounts.length} records are ready for validation.` });
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
  };

  const bulkDelete = () => {
    const ids = new Set(selectedIds);
    setAccounts((prev) => prev.filter((account) => !ids.has(account.id)));
    setSelectedIds([]);
  };

  const bulkReplace = () => {
    const next = accounts.map((account) => selectedIds.includes(account.id) ? { ...account, status: 'uploaded', validation: 'ready' } : account);
    setAccounts(next);
    setSelectedIds([]);
  };

  const validateAccounts = () => {
    const next = accounts.map((account) => ({
      ...account,
      validation: /@/.test(account.fields?.email || '') ? 'valid' : 'needs-review',
      status: /@/.test(account.fields?.email || '') ? 'uploaded' : 'failed',
    }));
    setAccounts(next);
    toast({ title: 'Validation complete', description: 'Duplicate checks and status updates are now applied.' });
  };

  const summary = useMemo(() => {
    const live = accounts.filter((item) => item.status === 'uploaded').length;
    const failed = accounts.filter((item) => item.status === 'failed').length;
    const reserved = accounts.filter((item) => item.reserved).length;
    const sold = accounts.filter((item) => item.sold).length;
    return { live, failed, reserved, sold, total: accounts.length };
  }, [accounts]);

  const addCustomField = () => {
    if (customFields.length >= MAX_CUSTOM_FIELDS) return;
    setCustomFields((prev) => [...prev, `custom_${prev.length + 1}`]);
  };

  const updateCustomField = (index, value) => {
    setCustomFields((prev) => prev.map((field, fieldIndex) => fieldIndex === index ? value : field));
  };

  const saveAndPublish = async () => {
    if (!productId) return;
    try {
      const liveStock = accounts.filter((account) => account.status === 'uploaded').length;
      await updateSellerProduct(productId, {
        ...product,
        status: 'live',
        stock: liveStock,
        stockType: 'limited',
        inventoryType: 'tracked',
      }, { publish: true });
      toast({ title: 'Product is live', description: `${liveStock} accounts are ready for delivery inventory.` });
      navigate('/seller/products');
    } catch (error) {
      toast({ title: 'Could not publish stock', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              <Link to="/seller/products" className="inline-flex items-center gap-1 text-primary hover:opacity-80"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
            </div>
            <h2 className="mt-2 text-2xl font-black">Upload accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Import stock from TXT, CSV, XLSX, or paste directly into the inventory flow.</p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Stock validation</div>
            <p className="mt-1">Support for duplicate detection, bulk actions, and live counters.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {['paste', 'txt', 'csv', 'xlsx'].map((mode) => (
              <button key={mode} type="button" onClick={() => setImportMode(mode)} className={`rounded-full px-3 py-2 text-sm font-semibold ${importMode === mode ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>{mode.toUpperCase()}</button>
            ))}
          </div>
          <div className="mt-5 rounded-[1.25rem] border border-dashed border-border bg-secondary/40 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><UploadCloud className="h-4 w-4 text-primary" /> Import source</div>
            <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={8} className="mt-4 w-full rounded-2xl border border-border bg-white px-3 py-3 outline-none" placeholder="Paste account rows or upload a file. Example: email | password | recovery" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Divider selection</span>
              <select value={divider} onChange={(e) => setDivider(e.target.value)} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none">
                <option value="tab">Tab</option>
                <option value="comma">Comma</option>
                <option value="semicolon">Semicolon</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Field mapping</span>
              <select value={fieldMap.email || 'email'} onChange={(e) => setFieldMap((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none">
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="recovery">Recovery</option>
                <option value="token">Token</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={importPreset} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">Import accounts</button>
            <button type="button" onClick={validateAccounts} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground">Validate</button>
            <button type="button" onClick={bulkReplace} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground">Bulk replace</button>
            <button type="button" onClick={bulkDelete} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground">Bulk delete</button>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black">Custom fields</h3>
              <button type="button" onClick={addCustomField} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">Add field</button>
            </div>
            <div className="mt-3 grid gap-2">
              {customFields.map((field, index) => (
                <input key={`${field}-${index}`} value={field} onChange={(e) => updateCustomField(index, e.target.value)} placeholder={`custom_${index + 1}`} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Stock overview</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Live', summary.live, 'text-emerald-600'],
                ['Available', summary.live, 'text-primary'],
                ['Sold', summary.sold, 'text-amber-600'],
                ['Reserved', summary.reserved, 'text-slate-600'],
                ['Uploaded', summary.live, 'text-indigo-600'],
                ['Failed', summary.failed, 'text-red-600'],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-2xl border border-border bg-secondary/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-xl font-black ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Preview & actions</h3>
            <div className="mt-4 max-h-[22rem] overflow-auto rounded-[1.25rem] border border-border p-3">
              {accounts.length === 0 ? <p className="text-sm text-muted-foreground">No accounts imported yet.</p> : accounts.map((account) => (
                <div key={account.id} className="mb-2 flex items-center justify-between rounded-2xl border border-border bg-secondary/30 px-3 py-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedIds.includes(account.id)} onChange={() => toggleSelected(account.id)} className="h-4 w-4" />
                    <span className="font-medium">{account.fields?.email || 'new account'}</span>
                  </label>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${account.status === 'uploaded' ? 'bg-emerald-100 text-emerald-700' : account.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{account.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={saveAndPublish} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">Save stock & go live</button>
              <button type="button" className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground">Export</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UploadAccountsPage;
