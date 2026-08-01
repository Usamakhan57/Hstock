import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Ban, RotateCcw, Store } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass } from '../../components/FormSheet';
import {
  getSellers, getSeller, createSeller, updateSeller, deleteSeller,
  approveSeller, rejectSeller, suspendSeller, reinstateSeller,
} from '../../api/sellers';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { storeName: '', ownerName: '', email: '', phone: '', commissionRate: '15', status: 'pending' };
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getSellers()
      .then((s) => { setSellers(s); setLoading(false); })
      .catch((error) => {
        setLoading(false);
        toast({
          title: 'Unable to load sellers',
          description: error?.message || 'Please try again.',
          variant: 'destructive',
        });
      });
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = async (row) => {
    setSheetOpen(true);
    setEditing(row);
    setForm({ ...row, commissionRate: String(row.commissionRate ?? 15) });
    try {
      const fresh = await getSeller(row.sellerProfileId || row.id || row.userId);
      setEditing(fresh);
      setForm({
        storeName: fresh.storeName || '',
        ownerName: fresh.ownerName || '',
        email: fresh.email || '',
        phone: fresh.phone || '',
        commissionRate: String(fresh.commissionRate ?? 15),
        status: fresh.status || 'pending',
      });
    } catch (error) {
      toast({
        title: 'Unable to load seller',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.storeName.trim() || !form.email.trim()) { toast({ title: 'Store name and email are required', variant: 'destructive' }); return; }
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
      if (editing) {
        await updateSeller(editing.sellerProfileId || editing.id || editing.userId, payload);
      } else {
        await createSeller({ ...payload, productsCount: 0, totalSales: 0, joinedAt: new Date().toISOString() });
      }
      toast({ title: editing ? 'Seller updated' : 'Seller added', description: payload.storeName });
      setSheetOpen(false);
      load();
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
      load();
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteSeller(deleteTarget.id);
    toast({ title: 'Seller deleted', description: deleteTarget.storeName });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Sellers"
        description={`${sellers.length} marketplace sellers`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Seller
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={sellers}
        searchKeys={['storeName', 'ownerName', 'email']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'suspended', label: 'Suspended' }] }]}
        onRowClick={openEdit}
        columns={[
          { key: 'storeName', label: 'Store', render: (row) => (<div><p className="font-medium">{row.storeName}</p><p className="text-xs text-muted-foreground">{row.ownerName}</p></div>) },
          { key: 'email', label: 'Email' },
          { key: 'productsCount', label: 'Products' },
          { key: 'totalSales', label: 'Total Sales', render: (row) => fmtMoney(row.totalSales) },
          { key: 'joinedAt', label: 'Joined', render: (row) => fmtDate(row.joinedAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
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
          { separator: true },
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: Store, title: 'No sellers yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit Seller' : 'Add Seller'} onSubmit={handleSubmit} submitting={saving}>
        <div>
          <label className="block text-sm font-medium mb-1.5">Store Name</label>
          <input value={form.storeName} onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Owner Name</label>
          <input value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Commission (%)</label>
            <input type="number" min="0" max="100" value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))} className={inputClass} />
          </div>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this seller?"
        description={deleteTarget ? `"${deleteTarget.storeName}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default SellersList;
