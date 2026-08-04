import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star, Quote } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import ImageUploadInput from '../../components/ImageUploadInput';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../../api/testimonials';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { customerName: '', photo: '', rating: 5, review: '', status: 'draft' };

const TestimonialsList = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getTestimonials().then((r) => { setRows(r); setLoading(false); }); };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm(row); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.review.trim()) { toast({ title: 'Customer name and review are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editing) await updateTestimonial(editing.id, form);
      else await createTestimonial(form);
      toast({ title: editing ? 'Testimonial updated' : 'Testimonial added', description: form.customerName });
      setSheetOpen(false);
      load();
    } catch (err) {
      toast({ title: 'Could not save testimonial', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteTestimonial(deleteTarget.id);
    toast({ title: 'Testimonial deleted', description: deleteTarget.customerName });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description={`${rows.length} testimonials`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={rows}
        searchKeys={['customerName', 'review']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }] }]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'customerName', label: 'Customer', render: (row) => (
              <div className="flex items-center gap-3">
                {row.photo ? (
                  <img src={row.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-secondary grid place-items-center text-xs font-semibold text-muted-foreground">
                    {row.customerName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <p className="font-medium">{row.customerName}</p>
              </div>
            ),
          },
          {
            key: 'review', label: 'Review', render: (row) => <p className="max-w-sm truncate text-muted-foreground">{row.review}</p>,
          },
          {
            key: 'rating', label: 'Rating', render: (row) => (
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < row.rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
                ))}
              </span>
            ),
          },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: Quote, title: 'No testimonials yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit Testimonial' : 'Add Testimonial'} onSubmit={handleSubmit} submitting={saving}>
        <ImageUploadInput label="Customer Photo" value={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Customer Name</label>
          <input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Rating</label>
          <Select value={String(form.rating)} onValueChange={(v) => setForm((f) => ({ ...f, rating: Number(v) }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} Star{n === 1 ? '' : 's'}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Review</label>
          <textarea value={form.review} onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))} className={`${textareaClass} min-h-[110px]`} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this testimonial?"
        description={deleteTarget ? `"${deleteTarget.customerName}"'s testimonial will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default TestimonialsList;
