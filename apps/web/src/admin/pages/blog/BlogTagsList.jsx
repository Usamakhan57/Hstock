import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { getBlogTags, createBlogTag, updateBlogTag, deleteBlogTag } from '../../api/blogTags';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', slug: '' };

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const BlogTagsList = () => {
  const { toast } = useToast();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getBlogTags().then((t) => { setTags(t); setLoading(false); });
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm(row); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) await updateBlogTag(editing.id, payload);
    else await createBlogTag({ ...payload, postCount: 0 });
    toast({ title: editing ? 'Tag updated' : 'Tag created', description: payload.name });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteBlogTag(deleteTarget.id);
    toast({ title: 'Tag deleted', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Blog Tags"
        description={`${tags.length} tags`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Tag
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={tags}
        searchKeys={['name', 'slug']}
        onRowClick={openEdit}
        columns={[
          {
            key: 'name', label: 'Tag', render: (row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">/{row.slug}</p>
              </div>
            ),
          },
          { key: 'postCount', label: 'Posts' },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ title: 'No tags yet' }}
      />

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? 'Edit Tag' : 'Add Tag'}
        onSubmit={handleSubmit}
        submitting={saving}
      >
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Licensing" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Slug</label>
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="auto-generated if left blank" />
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this tag?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed from all posts.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default BlogTagsList;
