import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, HelpCircle, Settings2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { getFaqCategories, createFaqCategory, updateFaqCategory, deleteFaqCategory } from '../../api/faqCategories';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../../api/faqs';
import { useToast } from '../../../hooks/use-toast';

const EMPTY_FAQ = { categoryId: '', question: '', answer: '', status: 'draft' };

const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const FaqList = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FAQ);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getFaqCategories(), getFaqs()]).then(([cats, items]) => {
      setCategories([...cats].sort((a, b) => a.sortOrder - b.sortOrder));
      setFaqs(items);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const visibleFaqs = useMemo(() => {
    const rows = activeCategory === 'all' ? faqs : faqs.filter((f) => f.categoryId === activeCategory);
    return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [faqs, activeCategory]);

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '—';

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FAQ, categoryId: activeCategory !== 'all' ? activeCategory : (categories[0]?.id || '') });
    setSheetOpen(true);
  };
  const openEdit = (faq) => { setEditing(faq); setForm(faq); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.categoryId) { toast({ title: 'Category and question are required', variant: 'destructive' }); return; }
    setSaving(true);
    if (editing) {
      await updateFaq(editing.id, form);
    } else {
      const siblingCount = faqs.filter((f) => f.categoryId === form.categoryId).length;
      await createFaq({ ...form, sortOrder: siblingCount + 1 });
    }
    toast({ title: editing ? 'FAQ updated' : 'FAQ added' });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    await deleteFaq(deleteTarget.id);
    toast({ title: 'FAQ deleted' });
    setDeleteTarget(null);
    load();
  };

  const moveFaq = async (faq, direction) => {
    const siblings = faqs.filter((f) => f.categoryId === faq.categoryId).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((f) => f.id === faq.id);
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= siblings.length) return;
    const a = siblings[idx];
    const b = siblings[swapWith];
    setFaqs((list) => list.map((f) => {
      if (f.id === a.id) return { ...f, sortOrder: b.sortOrder };
      if (f.id === b.id) return { ...f, sortOrder: a.sortOrder };
      return f;
    }));
    await Promise.all([updateFaq(a.id, { sortOrder: b.sortOrder }), updateFaq(b.id, { sortOrder: a.sortOrder })]);
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    await createFaqCategory({ name: newCatName, slug: slugify(newCatName), sortOrder: categories.length + 1 });
    setNewCatName('');
    load();
  };
  const renameCategory = async (id, name) => { setCategories((list) => list.map((c) => (c.id === id ? { ...c, name } : c))); await updateFaqCategory(id, { name, slug: slugify(name) }); };
  const removeCategory = async (id) => {
    await deleteFaqCategory(id);
    await Promise.all(faqs.filter((f) => f.categoryId === id).map((f) => deleteFaq(f.id)));
    if (activeCategory === id) setActiveCategory('all');
    load();
  };

  return (
    <div>
      <PageHeader
        title="FAQ"
        description="Questions and answers shown on the storefront FAQ page, grouped by category."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setCatSheetOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              <Settings2 className="w-4 h-4" /> Categories
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${activeCategory === 'all' ? 'brand-gradient text-white border-transparent' : 'border-border hover:bg-secondary'}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${activeCategory === c.id ? 'brand-gradient text-white border-transparent' : 'border-border hover:bg-secondary'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visibleFaqs.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No FAQs yet" description="Add the first question for this category." />
      ) : (
        <div className="space-y-3 max-w-3xl">
          {visibleFaqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-2xl border border-border p-4 flex items-start gap-3">
              <div className="flex flex-col shrink-0 pt-1">
                <button type="button" onClick={() => moveFaq(faq, 'up')} aria-label="Move up" className="p-0.5 rounded hover:bg-secondary text-muted-foreground">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveFaq(faq, 'down')} aria-label="Move down" className="p-0.5 rounded hover:bg-secondary text-muted-foreground">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-sm">{faq.question}</p>
                  <StatusBadge status={faq.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                {activeCategory === 'all' && <p className="text-[11px] text-muted-foreground mt-1">{categoryName(faq.categoryId)}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(faq)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" aria-label="Edit FAQ">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(faq)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors" aria-label="Delete FAQ">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit FAQ' : 'Add FAQ'} onSubmit={handleSubmit} submitting={saving}>
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Question</label>
          <input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Answer</label>
          <textarea value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} className={`${textareaClass} min-h-[110px]`} />
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

      <Sheet open={catSheetOpen} onOpenChange={setCatSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>FAQ Categories</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border p-3 bg-secondary/20">
                <input value={c.name} onChange={(e) => renameCategory(c.id, e.target.value)} className={`${inputClass} flex-1`} />
                <button type="button" onClick={() => removeCategory(c.id)} aria-label="Delete category" className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" className={`${inputClass} flex-1`} />
              <button type="button" onClick={addCategory} className="px-4 py-2.5 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this FAQ?"
        description={deleteTarget ? `"${deleteTarget.question}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default FaqList;
