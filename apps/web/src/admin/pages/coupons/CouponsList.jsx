import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, TicketPercent } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/coupons';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { code: '', type: 'percent', value: '', minSpend: '0', usageLimit: '100', status: 'active', expiresAt: '' };

const CouponsList = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getCoupons().then((c) => { setCoupons(c); setLoading(false); }); };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ ...row, value: String(row.value), minSpend: String(row.minSpend), usageLimit: String(row.usageLimit), expiresAt: row.expiresAt?.slice(0, 10) || '' }); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.value) { toast({ title: 'Code and value are required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      value: Number(form.value),
      minSpend: Number(form.minSpend || 0),
      usageLimit: Number(form.usageLimit || 0),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    if (editing) await updateCoupon(editing.id, payload);
    else await createCoupon({ ...payload, usedCount: 0 });
    toast({ title: editing ? 'Coupon updated' : 'Coupon created', description: payload.code });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteCoupon(deleteTarget.id);
    toast({ title: 'Coupon deleted', description: deleteTarget.code });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Coupons"
        description={`${coupons.length} coupons`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Coupon
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={coupons}
        searchKeys={['code']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'expired', label: 'Expired' }] }]}
        onRowClick={openEdit}
        columns={[
          { key: 'code', label: 'Code', render: (row) => <span className="font-mono font-semibold">{row.code}</span> },
          { key: 'value', label: 'Discount', render: (row) => row.type === 'percent' ? `${row.value}%` : `$${row.value}` },
          { key: 'minSpend', label: 'Min. Spend', render: (row) => row.minSpend ? `$${row.minSpend}` : '—' },
          { key: 'usedCount', label: 'Usage', render: (row) => `${row.usedCount} / ${row.usageLimit}` },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: TicketPercent, title: 'No coupons yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit Coupon' : 'Add Coupon'} onSubmit={handleSubmit} submitting={saving}>
        <div>
          <label className="block text-sm font-medium mb-1.5">Coupon Code</label>
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className={`${inputClass} font-mono uppercase`} placeholder="e.g. SUMMER25" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Value</label>
            <input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} className={inputClass} placeholder={form.type === 'percent' ? '25' : '5.00'} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Min. Spend ($)</label>
            <input type="number" min="0" value={form.minSpend} onChange={(e) => setForm((f) => ({ ...f, minSpend: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Usage Limit</label>
            <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Expires On</label>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this coupon?"
        description={deleteTarget ? `"${deleteTarget.code}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default CouponsList;
