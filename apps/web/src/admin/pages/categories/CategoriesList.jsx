import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Pencil, Trash2, Power, PowerOff, ChevronRight, ChevronDown,
  GripVertical, Star, Search as SearchIcon, Trash, RotateCcw, FolderPlus,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import MediaPickerField from '../../../components/media/MediaPickerField';
import FormSheet, { inputClass, textareaClass } from '../../components/FormSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../../components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import {
  getCategories, getTrashedCategories, createCategory, updateCategory,
  trashCategory, restoreCategory, permanentlyDeleteCategory, canDeleteCategory,
} from '../../api/categories';
import { getProductCountByCategoryId } from '../../../services/productRepository';
import {
  getCategoryTree, flattenCategories, isSelfOrDescendant, getRolledUpCount,
} from '../../../services/categoryTree';
import { useToast } from '../../../hooks/use-toast';

const ICON_CHOICES = [
  'Frame', 'Image', 'Boxes', 'Palette', 'CalendarDays', 'NotebookPen',
  'Printer', 'Mail', 'PencilRuler', 'Shirt', 'Trophy', 'Leaf', 'Grid3x3',
  'Layers', 'Dumbbell', 'Sparkles', 'Server', 'Coins', 'Shield', 'BadgeCheck',
  'Users', 'Globe2', 'Globe', 'Cloud', 'FileCode2', 'Smartphone', 'Bot',
  'LayoutTemplate', 'GraduationCap', 'BookOpen', 'Terminal', 'Send',
  'MessageCircle', 'Briefcase', 'Camera', 'Film', 'Puzzle', 'Monitor',
  'Instagram', 'Facebook', 'Music2', 'Youtube', 'Twitter',
];

const ROOT_VALUE = '__root__';

const EMPTY = {
  name: '', slug: '', description: '', image: '', icon: 'Sparkles', parentId: null,
  status: 'active', featured: false, showInHeader: true, showOnHomepage: true,
  seoTitle: '', metaDescription: '', ogImage: '',
};

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

/** One row in the category tree, recursively rendering its children when expanded. */
const CategoryRow = ({
  node, depth, expanded, onToggleExpand, productCounts, onEdit, onAddChild,
  onToggleEnabled, onTrash, onDragStart, onDragOver, onDrop, dragOverId,
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const count = getRolledUpCount(node, productCounts);

  return (
    <div>
      <div
        draggable
        onDragStart={() => onDragStart(node)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(node); }}
        onDrop={(e) => { e.preventDefault(); onDrop(node); }}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${dragOverId === node.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary/50'}`}
        style={{ marginLeft: depth * 28 }}
      >
        <span className="cursor-grab text-muted-foreground/50 shrink-0" aria-hidden="true"><GripVertical className="w-4 h-4" /></span>

        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(node.id)}
          className="w-5 h-5 grid place-items-center shrink-0 text-muted-foreground"
          aria-label={hasChildren ? (isExpanded ? 'Collapse' : 'Expand') : undefined}
        >
          {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </button>

        {node.image ? (
          <img src={node.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
        ) : (
          <span className="w-9 h-9 rounded-lg bg-secondary grid place-items-center shrink-0 text-muted-foreground text-xs font-bold">
            {node.name.charAt(0)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm truncate">{node.name}</p>
            {node.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">/{node.slug}</p>
        </div>

        <span className="text-xs text-muted-foreground w-20 text-right shrink-0">{count.toLocaleString()} items</span>

        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${node.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {node.status === 'active' ? 'Enabled' : 'Disabled'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors shrink-0" aria-label={`Actions for ${node.name}`}>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(node)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddChild(node)}><FolderPlus className="w-4 h-4 mr-2" /> Add Subcategory</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleEnabled(node)}>
              {node.status === 'active' ? <PowerOff className="w-4 h-4 mr-2" /> : <Power className="w-4 h-4 mr-2" />}
              {node.status === 'active' ? 'Disable' : 'Enable'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onTrash(node)} className="text-red-600 focus:text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Move to Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              productCounts={productCounts}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onToggleEnabled={onToggleEnabled}
              onTrash={onTrash}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoriesList = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [trashed, setTrashed] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [view, setView] = useState('active'); // 'active' | 'trash'
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [trashTarget, setTrashTarget] = useState(null);
  const [permanentTarget, setPermanentTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getCategories(), getTrashedCategories()]).then(([active, trash]) => {
      setCategories(active);
      setTrashed(trash);
      setProductCounts(getProductCountByCategoryId());
      setExpanded((prev) => (prev.size ? prev : new Set(active.map((c) => c.id))));
      setLoading(false);
    });
  };
  useEffect(load, []);

  const tree = useMemo(() => getCategoryTree(categories), [categories]);
  const flatOptions = useMemo(() => flattenCategories(tree), [tree]);

  const filteredTree = useMemo(() => {
    if (!query.trim()) return tree;
    const needle = query.trim().toLowerCase();
    const matches = categories.filter((c) => c.name.toLowerCase().includes(needle));
    // Rebuild a tree containing only matches — parentId links that fall
    // outside the match set are simply dropped (rendered as roots), which
    // keeps search results flat and easy to scan.
    const matchIds = new Set(matches.map((c) => c.id));
    return matches.map((c) => ({ ...c, children: [] })).map((c) => (matchIds.has(c.parentId) ? c : { ...c, parentId: null }));
  }, [query, categories, tree]);

  const toggleExpand = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openAdd = (parent = null) => {
    setEditing(null);
    setForm({ ...EMPTY, parentId: parent?.id || null });
    setSheetOpen(true);
  };
  const openEdit = (row) => { setEditing(row); setForm({ ...EMPTY, ...row }); setSheetOpen(true); };

  const parentOptions = useMemo(() => {
    if (!editing) return flatOptions;
    return flatOptions.filter((c) => !isSelfOrDescendant(categories, editing.id, c.id));
  }, [flatOptions, editing, categories]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    try {
      if (editing) {
        await updateCategory(editing.id, payload);
      } else {
        const siblingCount = categories.filter((c) => (c.parentId || null) === (payload.parentId || null)).length;
        await createCategory({ ...payload, displayOrder: siblingCount });
      }
      toast({ title: editing ? 'Category updated' : 'Category created', description: payload.name });
      setSheetOpen(false);
      load();
    } catch (error) {
      toast({
        title: 'Could not save category',
        description: error?.message || 'Please check the form and try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    await updateCategory(row.id, { status: next });
    toast({ title: next === 'active' ? 'Category enabled' : 'Category disabled', description: row.name });
    load();
  };

  const requestTrash = async (row) => {
    const result = await canDeleteCategory(row.id, productCounts);
    if (!result.ok) {
      toast({ title: 'Can\u2019t move this category to Trash', description: result.reason, variant: 'destructive' });
      return;
    }
    setTrashTarget(row);
  };

  const handleTrash = async () => {
    setBusy(true);
    await trashCategory(trashTarget.id);
    toast({ title: 'Category moved to Trash', description: trashTarget.name });
    setBusy(false);
    setTrashTarget(null);
    load();
  };

  const handleRestore = async (row) => {
    await restoreCategory(row.id);
    toast({ title: 'Category restored', description: row.name });
    load();
  };

  const handlePermanentDelete = async () => {
    setBusy(true);
    await permanentlyDeleteCategory(permanentTarget.id);
    toast({ title: 'Category permanently deleted', description: permanentTarget.name });
    setBusy(false);
    setPermanentTarget(null);
    load();
  };

  const handleDrop = async (targetNode) => {
    setDragOverId(null);
    if (!draggedId || draggedId === targetNode.id) return;
    const dragged = categories.find((c) => c.id === draggedId);
    if (!dragged) return;
    if ((dragged.parentId || null) !== (targetNode.parentId || null)) {
      toast({ title: 'Can only reorder within the same parent', description: 'Use Edit to move a category to a different parent.', variant: 'destructive' });
      return;
    }
    await Promise.all([
      updateCategory(dragged.id, { displayOrder: targetNode.displayOrder ?? 0 }),
      updateCategory(targetNode.id, { displayOrder: dragged.displayOrder ?? 0 }),
    ]);
    load();
  };

  const totalCount = categories.length;

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${totalCount} categories`}
        actions={
          <>
            <button
              onClick={() => setView((v) => (v === 'active' ? 'trash' : 'active'))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors"
            >
              <Trash className="w-4 h-4" /> {view === 'active' ? `Trash (${trashed.length})` : 'Back to Categories'}
            </button>
            {view === 'active' && (
              <button onClick={() => openAdd(null)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            )}
          </>
        }
      />

      {view === 'active' ? (
        <div className="bg-white rounded-2xl border border-border">
          <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-3.5 py-2 m-4 max-w-sm">
            <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground p-6">Loading…</p>
          ) : filteredTree.length === 0 ? (
            <EmptyState title="No categories found" description="Try a different search, or add your first category." />
          ) : (
            <div className="px-2 pb-4 space-y-0.5">
              {filteredTree.map((node) => (
                <CategoryRow
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggleExpand={toggleExpand}
                  productCounts={productCounts}
                  onEdit={openEdit}
                  onAddChild={openAdd}
                  onToggleEnabled={toggleEnabled}
                  onTrash={requestTrash}
                  onDragStart={(n) => setDraggedId(n.id)}
                  onDragOver={(n) => setDragOverId(n.id)}
                  onDrop={handleDrop}
                  dragOverId={dragOverId}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-2">
          {trashed.length === 0 ? (
            <EmptyState icon={Trash} title="Trash is empty" description="Categories you move to Trash will show up here." />
          ) : (
            <div className="space-y-1 p-2">
              {trashed.map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  {row.image ? (
                    <img src={row.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 grayscale opacity-70" />
                  ) : (
                    <span className="w-9 h-9 rounded-lg bg-secondary grid place-items-center shrink-0 text-muted-foreground text-xs font-bold">{row.name.charAt(0)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{row.name}</p>
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                  </div>
                  <button onClick={() => handleRestore(row)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-secondary transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  <button onClick={() => setPermanentTarget(row)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Wall Arts" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Slug</label>
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="auto-generated if left blank" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Parent Category</label>
          <Select
            value={form.parentId || ROOT_VALUE}
            onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === ROOT_VALUE ? null : v }))}
          >
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ROOT_VALUE}>— None (Top Level) —</SelectItem>
              {parentOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>{'\u2014 '.repeat(c.depth)}{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={textareaClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Icon</label>
          <Select value={form.icon} onValueChange={(v) => setForm((f) => ({ ...f, icon: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ICON_CHOICES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
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

        <div className="border-t border-border pt-2">
          <ToggleRow label="Featured" description="Highlight this category across the storefront." checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} />
          <ToggleRow label="Show in Header" description="Include in the header mega menu and mobile menu." checked={form.showInHeader} onChange={(v) => setForm((f) => ({ ...f, showInHeader: v }))} />
          <ToggleRow label="Show on Homepage" description="Include in the homepage category list." checked={form.showOnHomepage} onChange={(v) => setForm((f) => ({ ...f, showOnHomepage: v }))} />
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <p className="text-sm font-semibold">SEO</p>
          <div>
            <label className="block text-sm font-medium mb-1.5">SEO Title</label>
            <input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} className={inputClass} placeholder="Defaults to the category name if left blank" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Meta Description</label>
            <textarea value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} className={textareaClass} />
          </div>
          <MediaPickerField label="OG Image" value={form.ogImage} onChange={(v) => setForm((f) => ({ ...f, ogImage: v }))} modalTitle="Select OG Image" />
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!trashTarget}
        onOpenChange={(v) => !v && setTrashTarget(null)}
        title="Move this category to Trash?"
        description={trashTarget ? `"${trashTarget.name}" will be moved to Trash. You can restore it later.` : ''}
        onConfirm={handleTrash}
        busy={busy}
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
      />

      <ConfirmDeleteDialog
        open={!!permanentTarget}
        onOpenChange={(v) => !v && setPermanentTarget(null)}
        title="Permanently delete this category?"
        description={permanentTarget ? `"${permanentTarget.name}" will be permanently removed. This cannot be undone.` : ''}
        onConfirm={handlePermanentDelete}
        busy={busy}
        confirmLabel="Delete Permanently"
        busyLabel="Deleting…"
      />
    </div>
  );
};

export default CategoriesList;
