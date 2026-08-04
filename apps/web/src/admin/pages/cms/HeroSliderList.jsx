import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, GalleryHorizontal } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import ImageUploadInput from '../../components/ImageUploadInput';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide } from '../../api/heroSlides';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { title: '', subtitle: '', description: '', backgroundImage: '', buttonText: '', buttonUrl: '', status: 'draft' };

const HeroSliderList = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getHeroSlides().then((rows) => { setSlides([...rows].sort((a, b) => a.sortOrder - b.sortOrder)); setLoading(false); });
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (slide) => { setEditing(slide); setForm(slide); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editing) await updateHeroSlide(editing.id, form);
      else await createHeroSlide({ ...form, sortOrder: slides.length ? Math.max(...slides.map((s) => s.sortOrder)) + 1 : 1 });
      toast({ title: editing ? 'Slide updated' : 'Slide added', description: form.title });
      setSheetOpen(false);
      load();
    } catch (err) {
      toast({ title: 'Could not save slide', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteHeroSlide(deleteTarget.id);
    toast({ title: 'Slide deleted', description: deleteTarget.title });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  const moveSlide = async (index, direction) => {
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= slides.length) return;
    const a = slides[index];
    const b = slides[swapWith];
    setSlides((list) => {
      const next = [...list];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
    await Promise.all([updateHeroSlide(a.id, { sortOrder: b.sortOrder }), updateHeroSlide(b.id, { sortOrder: a.sortOrder })]);
  };

  return (
    <div>
      <PageHeader
        title="Hero Slider"
        description="Slides that rotate through the homepage hero when it's enabled."
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Slide
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : slides.length === 0 ? (
        <EmptyState icon={GalleryHorizontal} title="No slides yet" description="Add the first hero slide." />
      ) : (
        <div className="space-y-3 max-w-3xl">
          {slides.map((slide, index) => (
            <div key={slide.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
              <div className="flex flex-col shrink-0">
                <button type="button" onClick={() => moveSlide(index, 'up')} disabled={index === 0} aria-label="Move up" className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} aria-label="Move down" className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {slide.backgroundImage ? (
                <img src={slide.backgroundImage} alt="" className="w-24 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-24 h-14 rounded-xl bg-secondary grid place-items-center shrink-0">
                  <GalleryHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{slide.title}</p>
                <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>
              </div>

              <StatusBadge status={slide.status} />

              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(slide)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" aria-label="Edit slide">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(slide)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors" aria-label="Delete slide">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit Slide' : 'Add Slide'} onSubmit={handleSubmit} submitting={saving}>
        <ImageUploadInput label="Background Image" value={form.backgroundImage} onChange={(v) => setForm((f) => ({ ...f, backgroundImage: v }))} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Subtitle</label>
          <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={textareaClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Button Text</label>
            <input value={form.buttonText} onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Button URL</label>
            <input value={form.buttonUrl} onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))} className={inputClass} />
          </div>
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
        title="Delete this slide?"
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default HeroSliderList;
