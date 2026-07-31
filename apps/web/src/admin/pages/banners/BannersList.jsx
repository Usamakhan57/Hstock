import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GalleryHorizontal } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import ImageUploadInput from '../../components/ImageUploadInput';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../../api/banners';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { title: '', image: '', mobileImage: '', link: '', buttonText: '', position: 'homepage', status: 'draft', startAt: '', endAt: '' };

const POSITIONS = [
  { value: 'homepage', label: 'Homepage Banner' },
  { value: 'category', label: 'Category Banner' },
  { value: 'collection', label: 'Collection Banner' },
  { value: 'sidebar', label: 'Sidebar Banner' },
  { value: 'popup', label: 'Popup Banner' },
  { value: 'sale', label: 'Sale Banner' },
];

const BannersList = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getBanners().then((b) => { setBanners(b); setLoading(false); }); };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ ...row, startAt: row.startAt?.slice(0, 10) || '', endAt: row.endAt?.slice(0, 10) || '' }); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.image) { toast({ title: 'Title and image are required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      ...form,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
    };
    if (editing) await updateBanner(editing.id, payload);
    else await createBanner(payload);
    toast({ title: editing ? 'Banner updated' : 'Banner created', description: payload.title });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteBanner(deleteTarget.id);
    toast({ title: 'Banner deleted', description: deleteTarget.title });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Promotional Banners"
        description={`${banners.length} banners`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={banners}
        searchKeys={['title']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'draft', label: 'Draft' }] }]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'title', label: 'Banner', render: (row) => (
              <div className="flex items-center gap-3">
                <img src={row.image} alt="" className="w-14 h-9 rounded-lg object-cover" />
                <p className="font-medium">{row.title}</p>
              </div>
            ),
          },
          { key: 'position', label: 'Position', render: (row) => POSITIONS.find((p) => p.value === row.position)?.label || row.position },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: GalleryHorizontal, title: 'No banners yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit Banner' : 'Add Banner'} onSubmit={handleSubmit} submitting={saving}>
        <ImageUploadInput label="Banner Image" value={form.image} onChange={(v) => setForm((f) => ({ ...f, image: v }))} />
        <ImageUploadInput label="Mobile Image (optional)" value={form.mobileImage} onChange={(v) => setForm((f) => ({ ...f, mobileImage: v }))} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Link URL</label>
          <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} className={inputClass} placeholder="/shop?search=sale" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Button Text</label>
          <input value={form.buttonText} onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))} className={inputClass} placeholder="e.g. Shop Now" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Position</label>
          <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POSITIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Start Date</label>
            <input type="date" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">End Date</label>
            <input type="date" value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this banner?"
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default BannersList;
