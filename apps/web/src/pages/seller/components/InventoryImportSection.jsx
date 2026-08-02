import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import {
  parseInventoryText,
  validateInventoryAccounts,
} from '../lib/inventoryImport';

const IMPORT_MODES = ['paste', 'txt', 'csv', 'xlsx'];
const MAX_CUSTOM_FIELDS = 20;

/**
 * Instant Access inventory import workflow:
 * Paste/TXT/CSV/XLSX, divider selection, validation, duplicate detection.
 */
const InventoryImportSection = ({
  productId,
  accounts,
  onAccountsChange,
  className = '',
}) => {
  const { toast } = useToast();
  const [importMode, setImportMode] = useState('paste');
  const [rawText, setRawText] = useState('');
  const [divider, setDivider] = useState('tab');
  const [selectedIds, setSelectedIds] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [fieldMap, setFieldMap] = useState({ email: 'email' });

  useEffect(() => {
    if (!rawText.trim()) {
      onAccountsChange?.([]);
      return;
    }
    onAccountsChange?.(parseInventoryText(rawText, divider));
    // Parent setters are stable; avoid re-parsing on unrelated parent renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText, divider]);

  const summary = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    const live = list.filter((item) => item.status === 'uploaded' || item.validation === 'valid').length;
    const failed = list.filter((item) => item.status === 'failed').length;
    const duplicates = list.filter((item) => item.validation === 'duplicate').length;
    return {
      live,
      failed,
      duplicates,
      total: list.length,
    };
  }, [accounts]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (importMode === 'xlsx') {
      toast({
        title: 'XLSX tip',
        description: 'Paste spreadsheet rows or export to CSV/TXT, then import here.',
      });
      return;
    }

    try {
      const text = await file.text();
      setRawText(text);
      toast({ title: 'File loaded', description: `${file.name} is ready to import.` });
    } catch {
      toast({
        title: 'Could not read file',
        description: 'Try Paste mode or another TXT/CSV file.',
        variant: 'destructive',
      });
    }
  };

  const importPreset = () => {
    if (!rawText.trim()) {
      toast({
        title: 'Nothing to import',
        description: 'Paste or upload a list of accounts first.',
        variant: 'destructive',
      });
      return;
    }

    const parsed = parseInventoryText(rawText, divider).map((account, index) => ({
      ...account,
      id: `${productId || 'product'}-${index + 1}`,
      status: 'uploaded',
      source: importMode,
      validation: 'ready',
      available: true,
      sold: 0,
      reserved: 0,
      failed: 0,
    }));
    onAccountsChange?.(parsed);
    toast({
      title: 'Accounts imported',
      description: `${parsed.length} records are ready for validation.`,
    });
  };

  const validateAccounts = () => {
    const list = Array.isArray(accounts) ? accounts : [];
    if (list.length === 0) {
      toast({
        title: 'No inventory yet',
        description: 'Import accounts before running validation.',
        variant: 'destructive',
      });
      return;
    }
    const next = validateInventoryAccounts(list);
    onAccountsChange?.(next);
    const duplicates = next.filter((item) => item.validation === 'duplicate').length;
    toast({
      title: 'Validation complete',
      description: duplicates
        ? `${duplicates} duplicate row${duplicates === 1 ? '' : 's'} flagged.`
        : 'Duplicate checks and status updates are now applied.',
    });
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const bulkDelete = () => {
    const ids = new Set(selectedIds);
    onAccountsChange?.((Array.isArray(accounts) ? accounts : []).filter((account) => !ids.has(account.id)));
    setSelectedIds([]);
  };

  const bulkReplace = () => {
    const next = (Array.isArray(accounts) ? accounts : []).map((account) => (
      selectedIds.includes(account.id)
        ? { ...account, status: 'uploaded', validation: 'ready' }
        : account
    ));
    onAccountsChange?.(next);
    setSelectedIds([]);
  };

  const addCustomField = () => {
    if (customFields.length >= MAX_CUSTOM_FIELDS) return;
    setCustomFields((prev) => [...prev, `custom_${prev.length + 1}`]);
  };

  const updateCustomField = (index, value) => {
    setCustomFields((prev) => prev.map((field, fieldIndex) => (fieldIndex === index ? value : field)));
  };

  return (
    <section className={`space-y-6 ${className}`.trim()}>
      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Inventory Import</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Import Instant Access stock from Paste, TXT, CSV, or XLSX. Validate rows and catch duplicates before publishing.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Stock validation
            </div>
            <p className="mt-1">Required for Instant Access products.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {IMPORT_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setImportMode(mode)}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${importMode === mode ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-dashed border-border bg-secondary/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UploadCloud className="h-4 w-4 text-primary" /> Import Source
            </div>
            {importMode !== 'paste' ? (
              <label className="cursor-pointer rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground">
                Choose {importMode.toUpperCase()} file
                <input
                  type="file"
                  accept={importMode === 'csv' ? '.csv,text/csv' : importMode === 'xlsx' ? '.xlsx,.xls' : '.txt,text/plain'}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            ) : null}
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            className="mt-4 w-full rounded-2xl border border-border bg-white px-3 py-3 outline-none"
            placeholder="Paste account rows or upload a file. Example: email[TAB]password[TAB]recovery"
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>Divider Selection</span>
            <select
              value={divider}
              onChange={(e) => setDivider(e.target.value)}
              className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none"
            >
              <option value="tab">Tab</option>
              <option value="comma">Comma</option>
              <option value="semicolon">Semicolon</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>Field mapping</span>
            <select
              value={fieldMap.email || 'email'}
              onChange={(e) => setFieldMap((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none"
            >
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="recovery">Recovery</option>
              <option value="token">Token</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={importPreset} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            Import accounts
          </button>
          <button type="button" onClick={validateAccounts} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground">
            Validate
          </button>
          <button type="button" onClick={bulkReplace} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground">
            Bulk replace
          </button>
          <button type="button" onClick={bulkDelete} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground">
            Bulk delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black">Stock overview</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['Imported', summary.total, 'text-foreground'],
              ['Ready', summary.live, 'text-emerald-600'],
              ['Duplicates', summary.duplicates, 'text-amber-600'],
              ['Failed', summary.failed, 'text-red-600'],
            ].map(([label, value, tone]) => (
              <div key={label} className="rounded-2xl border border-border bg-secondary/40 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <p className={`mt-1 text-xl font-black ${tone}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[1.25rem] border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black">Custom fields</h4>
              <button type="button" onClick={addCustomField} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
                Add field
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              {customFields.map((field, index) => (
                <input
                  key={`${field}-${index}`}
                  value={field}
                  onChange={(e) => updateCustomField(index, e.target.value)}
                  placeholder={`custom_${index + 1}`}
                  className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black">Preview & validation</h3>
          <div className="mt-4 max-h-[22rem] overflow-auto rounded-[1.25rem] border border-border p-3">
            {!accounts?.length ? (
              <p className="text-sm text-muted-foreground">No accounts imported yet.</p>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-border bg-secondary/30 px-3 py-2">
                  <label className="flex min-w-0 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(account.id)}
                      onChange={() => toggleSelected(account.id)}
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="truncate font-medium">{account.fields?.email || 'new account'}</span>
                  </label>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    account.validation === 'duplicate'
                      ? 'bg-amber-100 text-amber-700'
                      : account.status === 'uploaded' || account.validation === 'valid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : account.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                  }`}
                  >
                    {account.validation === 'duplicate' ? <AlertTriangle className="h-3 w-3" /> : null}
                    {(account.status === 'uploaded' || account.validation === 'valid') && account.validation !== 'duplicate'
                      ? <CheckCircle2 className="h-3 w-3" />
                      : null}
                    {account.validation === 'duplicate' ? 'duplicate' : account.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InventoryImportSection;
