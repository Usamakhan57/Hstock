import React, { useCallback, useEffect, useState } from 'react';
import {
  Pencil, Check, X, Ban, RotateCcw, Store, BadgeCheck, ShieldOff, Trash2,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormSheet, { inputClass } from '../../components/FormSheet';
import {
  getSellers, getSeller, updateSeller,
  approveSeller, rejectSeller, suspendSeller, reinstateSeller,
  verifySellerBadge, unverifySellerBadge, deleteSeller,
} from '../../api/sellers';
import { useToast } from '../../../hooks/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';

const EMPTY = {
  storeName: '',
  ownerName: '',
  email: '',
  phone: '',
  commissionRate: '15',
  status: 'pending',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const SellersList = () => {
  const { toast } = useToast();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getSellers();
      setSellers(Array.isArray(list) ? list : []);
    } catch (error) {
      toast({
        title: 'Unable to load sellers',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = async (row) => {
    setSheetOpen(true);
    setEditing(row);
    setForm({
      storeName: row.storeName || '',
      ownerName: row.ownerName || '',
      email: row.email || '',
      phone: row.phone || '',
      commissionRate: String(row.commissionRate ?? row.commission ?? 15),
      status: row.status || 'pending',
    });
    setLoadingSeller(true);
    try {
      const fresh = await getSeller(row.sellerProfileId || row.id || row.userId);
      setEditing(fresh);
      setForm({
        storeName: fresh.storeName || '',
        ownerName: fresh.ownerName || '',
        email: fresh.email || '',
        phone: fresh.phone || '',
        commissionRate: String(fresh.commissionRate ?? fresh.commission ?? 15),
        status: fresh.status || 'pending',
      });
    } catch (error) {
      toast({
        title: 'Unable to load seller',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSeller(false);
    }
  };

  const handleSubmit = async () => {
    if (!editing) return;
    if (!form.storeName.trim() || !form.email.trim()) {
      toast({ title: 'Store name and email are required', variant: 'destructive' });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        storeName: form.storeName.trim(),
        ownerName: form.ownerName?.trim() || '',
        email: form.email.trim(),
        phone: form.phone || '',
        commissionRate: Number(form.commissionRate || 15),
        status: form.status,
      };
      await updateSeller(editing.sellerProfileId || editing.id || editing.userId, payload);
      toast({
        title: 'Seller updated',
        description: `${payload.storeName} saved successfully.`,
      });
      setSheetOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      toast({
        title: 'Unable to save seller',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (fn, row, message) => {
    try {
      await fn(row.sellerProfileId || row.id || row.userId);
      toast({ title: message, description: row.storeName });
      await load();
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== 'DELETE' || deleting) return;
    setDeleting(true);
    try {
      await deleteSeller(deleteTarget.sellerProfileId || deleteTarget.id || deleteTarget.userId, {
        confirm: 'DELETE',
      });
      try {
        const { invalidateSellerCatalog } = await import('../../../services/catalogCache');
        await invalidateSellerCatalog();
      } catch {
        // storefront cache may be unavailable in admin context
      }
      toast({ title: 'Seller deleted', description: deleteTarget.storeName });
      setDeleteTarget(null);
      setDeleteConfirm('');
      await load();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sellers"
        description={`${sellers.length} marketplace sellers`}
      />

      <DataTable
        isLoading={loading}
        data={sellers}
        searchKeys={['storeName', 'ownerName', 'email']}
        filters={[{
          key: 'status',
          label: 'Status',
          options: STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        }]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'storeName',
            label: 'Store',
            render: (row) => (
              <div>
                <p className="font-medium">{row.storeName}</p>
                <p className="text-xs text-muted-foreground">{row.ownerName}</p>
              </div>
            ),
          },
          { key: 'email', label: 'Email' },
          { key: 'productsCount', label: 'Products' },
          { key: 'totalSales', label: 'Total Sales', render: (row) => fmtMoney(row.totalSales) },
          {
            key: 'commissionRate',
            label: 'Commission',
            render: (row) => `${Number(row.commissionRate ?? row.commission ?? 15)}%`,
          },
          { key: 'joinedAt', label: 'Joined', render: (row) => fmtDate(row.joinedAt) },
          {
            key: 'verified',
            label: 'Verified',
            render: (row) => (
              <span className={`text-sm font-semibold ${row.verified ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                {row.verified ? 'Yes' : 'No'}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status || 'pending'} />,
          },
        ]}
        rowActions={(row) => [
          ...(row.status === 'pending' ? [
            { label: 'Approve', icon: Check, onClick: () => runAction(approveSeller, row, 'Seller approved') },
            { label: 'Reject', icon: X, onClick: () => runAction(rejectSeller, row, 'Seller rejected') },
          ] : []),
          ...(row.status === 'approved' ? [
            { label: 'Suspend', icon: Ban, onClick: () => runAction(suspendSeller, row, 'Seller suspended') },
          ] : []),
          ...(row.status === 'suspended' || row.status === 'rejected' ? [
            { label: 'Reinstate', icon: RotateCcw, onClick: () => runAction(reinstateSeller, row, 'Seller reinstated') },
          ] : []),
          ...(row.verified ? [
            { label: 'Unverify', icon: ShieldOff, onClick: () => runAction(unverifySellerBadge, row, 'Verification removed') },
          ] : [
            { label: 'Verify', icon: BadgeCheck, onClick: () => runAction(verifySellerBadge, row, 'Seller verified') },
          ]),
          { separator: true },
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          {
            label: 'Delete Seller',
            icon: Trash2,
            onClick: () => { setDeleteTarget(row); setDeleteConfirm(''); },
          },
        ]}
        emptyState={{ icon: Store, title: 'No sellers yet' }}
      />

      <FormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setSheetOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? 'Edit Seller' : 'Seller'}
        onSubmit={handleSubmit}
        submitting={saving || loadingSeller}
      >
        <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current status</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge status={form.status || 'pending'} />
            <span className={`text-sm font-semibold ${editing?.verified ? 'text-emerald-700' : 'text-muted-foreground'}`}>
              Verified: {editing?.verified ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Store Name</label>
          <input
            value={form.storeName}
            onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
            className={inputClass}
            disabled={loadingSeller || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Owner Name</label>
          <input
            value={form.ownerName}
            onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
            className={inputClass}
            disabled={loadingSeller || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
            disabled={loadingSeller || saving}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
              disabled={loadingSeller || saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Commission (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.commissionRate}
              onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
              className={inputClass}
              disabled={loadingSeller || saving}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={inputClass}
            disabled={loadingSeller || saving}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Approval unlocks selling only. Verified badge is payment-based and separate.
          </p>
        </div>
      </FormSheet>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (deleting) return;
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirm('');
          }
        }}
      >
        <DialogContent className="max-w-[440px] rounded-[24px] border border-border bg-background p-0 overflow-hidden">
          <div className="px-6 py-6">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-red-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="mt-4 text-xl font-bold">Delete Seller Account?</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              This action is permanent. Seller account, profile and marketplace data will be removed.
              Financial history (orders, payments, escrow, ledger) is preserved.
            </DialogDescription>
            <p className="mt-4 text-sm font-semibold text-foreground">
              {deleteTarget?.storeName}
            </p>
            <label className="mt-4 block text-sm font-medium mb-1.5">
              Type DELETE to continue
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className={inputClass}
              placeholder="DELETE"
              disabled={deleting}
              autoComplete="off"
            />
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || deleteConfirm !== 'DELETE'}
                onClick={handleDelete}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete Seller'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellersList;
