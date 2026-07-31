import React, { useEffect, useState } from 'react';
import { Check, X, Trash2, Star, Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { getReviews, updateReview, deleteReview, deleteReviews } from '../../api/reviews';
import { useToast } from '../../../hooks/use-toast';

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />)}
  </div>
);

const ReviewsList = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getReviews().then((r) => { setReviews(r); setLoading(false); }); };
  useEffect(load, []);

  const setStatus = async (row, status) => {
    await updateReview(row.id, { status });
    toast({ title: `Review ${status}`, description: row.productTitle });
    load();
  };

  const openEdit = (row) => { setEditing(row); setForm({ comment: row.comment, rating: row.rating }); };

  const handleSubmit = async () => {
    setSaving(true);
    await updateReview(editing.id, form);
    toast({ title: 'Review updated' });
    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteReview(deleteTarget.id);
    toast({ title: 'Review deleted' });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader title="Reviews" description={`${reviews.length} reviews`} />

      <DataTable
        isLoading={loading}
        data={reviews}
        searchKeys={['productTitle', 'customerName', 'comment']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] }]}
        bulkActions={[{ label: 'Delete', destructive: true, onClick: async (ids) => { await deleteReviews(ids); toast({ title: `${ids.length} reviews deleted` }); load(); } }]}
        columns={[
          { key: 'productTitle', label: 'Product', render: (row) => <span className="font-medium">{row.productTitle}</span> },
          { key: 'customerName', label: 'Customer' },
          { key: 'rating', label: 'Rating', render: (row) => <Stars rating={row.rating} /> },
          { key: 'comment', label: 'Comment', render: (row) => <span className="text-muted-foreground line-clamp-1 max-w-xs block">{row.comment}</span> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Approve', icon: Check, onClick: () => setStatus(row, 'approved') },
          { label: 'Reject', icon: X, onClick: () => setStatus(row, 'rejected') },
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: Star, title: 'No reviews yet' }}
      />

      {form && (
        <FormSheet open={!!editing} onOpenChange={(v) => !v && setEditing(null)} title="Edit Review" onSubmit={handleSubmit} submitting={saving}>
          <div>
            <label className="block text-sm font-medium mb-1.5">Rating</label>
            <input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Comment</label>
            <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} className={textareaClass} />
          </div>
        </FormSheet>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this review?"
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default ReviewsList;
