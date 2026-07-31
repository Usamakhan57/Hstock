import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import MediaPickerField from '../../../components/media/MediaPickerField';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getBlogAuthors, createBlogAuthor, updateBlogAuthor, deleteBlogAuthor } from '../../api/blogAuthors';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', avatar: '', bio: '', socialLinks: [] };
const PLATFORMS = ['website', 'twitter', 'instagram', 'facebook', 'linkedin', 'youtube'];

const BlogAuthorsList = () => {
  const { toast } = useToast();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getBlogAuthors().then((a) => { setAuthors(a); setLoading(false); });
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ ...EMPTY, ...row }); setSheetOpen(true); };

  const addSocialLink = () => setForm((f) => ({ ...f, socialLinks: [...f.socialLinks, { platform: 'website', url: '' }] }));
  const updateSocialLink = (idx, patch) => setForm((f) => ({
    ...f,
    socialLinks: f.socialLinks.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
  }));
  const removeSocialLink = (idx) => setForm((f) => ({ ...f, socialLinks: f.socialLinks.filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    if (editing) await updateBlogAuthor(editing.id, form);
    else await createBlogAuthor(form);
    toast({ title: editing ? 'Author updated' : 'Author created', description: form.name });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteBlogAuthor(deleteTarget.id);
    toast({ title: 'Author deleted', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Blog Authors"
        description={`${authors.length} authors`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Author
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={authors}
        searchKeys={['name']}
        onRowClick={openEdit}
        columns={[
          {
            key: 'name', label: 'Author', render: (row) => (
              <div className="flex items-center gap-3">
                {row.avatar ? (
                  <img src={row.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="w-9 h-9 rounded-full brand-gradient text-white grid place-items-center text-xs font-bold">
                    {row.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                )}
                <p className="font-medium">{row.name}</p>
              </div>
            ),
          },
          { key: 'bio', label: 'Bio', render: (row) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs block">{row.bio}</span> },
          { key: 'socialLinks', label: 'Social Links', render: (row) => (row.socialLinks?.length ? `${row.socialLinks.length} link(s)` : '—') },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ title: 'No authors yet' }}
      />

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? 'Edit Author' : 'Add Author'}
        onSubmit={handleSubmit}
        submitting={saving}
      >
        <MediaPickerField label="Avatar" value={form.avatar} onChange={(v) => setForm((f) => ({ ...f, avatar: v }))} modalTitle="Select Author Avatar" />
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Petal & Ink" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className={textareaClass} placeholder="A sentence or two about this author…" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium">Social Links</label>
            <button type="button" onClick={addSocialLink} className="text-xs font-semibold text-primary hover:underline">+ Add link</button>
          </div>
          <div className="space-y-2">
            {form.socialLinks.length === 0 && <p className="text-xs text-muted-foreground">No social links yet.</p>}
            {form.socialLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select value={link.platform} onValueChange={(v) => updateSocialLink(i, { platform: v })}>
                  <SelectTrigger className="rounded-xl w-32 shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input
                  value={link.url}
                  onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                  className={inputClass}
                  placeholder="https://…"
                />
                <button type="button" onClick={() => removeSocialLink(i)} aria-label="Remove link" className="p-2 rounded-lg hover:bg-secondary transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this author?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed. Posts by this author will need to be reassigned.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default BlogAuthorsList;
