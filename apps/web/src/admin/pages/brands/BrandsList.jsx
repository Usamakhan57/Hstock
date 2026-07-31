import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import ImageUploadInput from '../../components/ImageUploadInput';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../../api/brands';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', logo: '', website: '', description: '', status: 'active' };

const BrandsList = () => {
  const { toast } = useToast();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getBrands().then((b) => { setBrands(b); setLoading(false); }); };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm(row); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    if (editing) await updateBrand(editing.id, form);
    else await createBrand({ ...form, productCount: 0 });
    toast({ title: editing ? 'Brand updated' : 'Brand created', description: form.name });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteBrand(deleteTarget.id);
    toast({ title: 'Brand deleted', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Brands"
        description={`${brands.length} brands`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Brand
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={brands}
        searchKeys={['name']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'name', label: 'Brand', render: (row) => (
              <div className="flex items-center gap-3">
                <img src={row.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <p className="font-medium">{row.name}</p>
              </div>
            ),
          },
          { key: 'productCount', label: 'Products' },
          { key: 'website', label: 'Website', render: (row) => row.website ? <a href={row.website} target="_blank" rel="noreferrer" className="text-primary text-xs" onClick={(e) => e.stopPropagation()}>{row.website.replace(/^https?:\/\//, '')}</a> : '—' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ title: 'No brands yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit Brand' : 'Add Brand'} onSubmit={handleSubmit} submitting={saving}>
        <ImageUploadInput label="Logo" value={form.logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Website</label>
          <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className={inputClass} placeholder="https://" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={textareaClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this brand?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default BrandsList;
