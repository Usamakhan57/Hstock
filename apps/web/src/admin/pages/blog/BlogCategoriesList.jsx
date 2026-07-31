import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, ArrowUp, ArrowDown } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import MediaPickerField from '../../../components/media/MediaPickerField';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory } from '../../api/blogCategories';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', slug: '', description: '', icon: '', image: '', status: 'active' };

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const BlogCategoriesList = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getBlogCategories().then((c) => {
      setCategories([...c].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setLoading(false);
    });
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm(row); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) await updateBlogCategory(editing.id, payload);
    else await createBlogCategory({ ...payload, postCount: 0, order: categories.length });
    toast({ title: editing ? 'Category updated' : 'Category created', description: payload.name });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const toggleEnabled = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    await updateBlogCategory(row.id, { status: next });
    toast({ title: next === 'active' ? 'Category enabled' : 'Category disabled', description: row.name });
    load();
  };

  const move = async (row, direction) => {
    const idx = categories.findIndex((c) => c.id === row.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const other = categories[swapIdx];
    await Promise.all([
      updateBlogCategory(row.id, { order: other.order ?? swapIdx }),
      updateBlogCategory(other.id, { order: row.order ?? idx }),
    ]);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteBlogCategory(deleteTarget.id);
    toast({ title: 'Category deleted', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Blog Categories"
        description={`${categories.length} categories`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={categories}
        searchKeys={['name', 'slug']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'active', label: 'Enabled' }, { value: 'inactive', label: 'Disabled' }] }]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'name', label: 'Category', render: (row) => (
              <div className="flex items-center gap-3">
                {row.image && <img src={row.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">/{row.slug}</p>
                </div>
              </div>
            ),
          },
          { key: 'postCount', label: 'Posts' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status === 'active' ? 'active' : 'inactive'} /> },
          {
            key: 'order',
            label: 'Reorder',
            render: (row) => (
              <div className="flex items-center gap-1" data-no-row-click>
                <button type="button" onClick={() => move(row, 'up')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" aria-label={`Move ${row.name} up`}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => move(row, 'down')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" aria-label={`Move ${row.name} down`}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: row.status === 'active' ? 'Disable' : 'Enable', icon: row.status === 'active' ? PowerOff : Power, onClick: () => toggleEnabled(row) },
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ title: 'No blog categories yet' }}
      />

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? 'Edit Category' : 'Add Category'}
        onSubmit={handleSubmit}
        submitting={saving}
      >
        <MediaPickerField label="Image (optional)" value={form.image} onChange={(v) => setForm((f) => ({ ...f, image: v }))} modalTitle="Select Category Image" />
        <div>
          <label className="block text-sm font-medium mb-1.5">Category Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Guides" />
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
          <label className="block text-sm font-medium mb-1.5">Icon (optional)</label>
          <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className={inputClass} placeholder="lucide-react icon name, e.g. BookOpen" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Enabled</SelectItem>
              <SelectItem value="inactive">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this category?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed. Posts in this category will need to be reassigned.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default BlogCategoriesList;
