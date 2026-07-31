import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import ImageUploadInput from '../../components/ImageUploadInput';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getCollections, createCollection, updateCollection, deleteCollection } from '../../api/collections';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', slug: '', image: '', description: '', status: 'active' };

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CollectionsList = () => {
  const { toast } = useToast();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getCollections().then((c) => { setCollections(c); setLoading(false); }); };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ ...EMPTY, ...row }); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) await updateCollection(editing.id, payload);
    else await createCollection({ ...payload, productIds: [] });
    toast({ title: editing ? 'Collection updated' : 'Collection created', description: payload.name });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteCollection(deleteTarget.id);
    toast({ title: 'Collection deleted', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Collections"
        description={`${collections.length} curated collections`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Collection
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={collections}
        searchKeys={['name', 'slug']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }] }]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'name', label: 'Collection', render: (row) => (
              <div className="flex items-center gap-3">
                <img src={row.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">/{row.slug}</p>
                </div>
              </div>
            ),
          },
          { key: 'productIds', label: 'Products', render: (row) => (row.productIds || []).length },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: Layers, title: 'No collections yet' }}
      />

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? 'Edit Collection' : 'Add Collection'}
        onSubmit={handleSubmit}
        submitting={saving}
      >
        <ImageUploadInput label="Cover Image" value={form.image} onChange={(v) => setForm((f) => ({ ...f, image: v }))} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Editors' Picks" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Slug</label>
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="auto-generated if left blank" />
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
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this collection?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default CollectionsList;
