import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, CornerDownRight, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getNavMenu, updateNavMenu } from '../../api/navMenus';
import { useToast } from '../../../hooks/use-toast';

const ICON_CHOICES = ['', 'Home', 'ShoppingBag', 'Layers', 'Tag', 'Info', 'HelpCircle', 'Mail', 'FileText', 'Store', 'Star'];

const EMPTY_ITEM = { label: '', url: '', icon: '', openInNewTab: false, parentId: null };

const nextSortOrder = (items, parentId) => {
  const siblings = items.filter((i) => (i.parentId || null) === (parentId || null));
  return siblings.length ? Math.max(...siblings.map((s) => s.sortOrder || 0)) + 1 : 1;
};

const NavMenuEditor = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [menu, setMenu] = useState(null);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getNavMenu(id).then((m) => { setMenu(m); setItems(m?.items || []); });
  }, [id]);

  const topLevel = useMemo(
    () => items.filter((i) => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );
  const childrenOf = (parentId) => items.filter((i) => i.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const openAdd = (parentId = null) => { setEditingId(null); setForm({ ...EMPTY_ITEM, parentId }); setSheetOpen(true); };
  const openEdit = (item) => { setEditingId(item.id); setForm(item); setSheetOpen(true); };

  const handleSubmit = () => {
    if (!form.label.trim()) { toast({ title: 'Label is required', variant: 'destructive' }); return; }
    if (editingId) {
      setItems((list) => list.map((i) => (i.id === editingId ? { ...i, ...form } : i)));
    } else {
      const newItem = { ...form, id: `item-${Date.now()}`, sortOrder: nextSortOrder(items, form.parentId) };
      setItems((list) => [...list, newItem]);
    }
    setSheetOpen(false);
  };

  const moveItem = (item, direction) => {
    const siblings = childrenOf(item.parentId);
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= siblings.length) return;
    const a = siblings[idx];
    const b = siblings[swapWith];
    setItems((list) => list.map((i) => {
      if (i.id === a.id) return { ...i, sortOrder: b.sortOrder };
      if (i.id === b.id) return { ...i, sortOrder: a.sortOrder };
      return i;
    }));
  };

  const handleDelete = () => {
    // Deleting a parent also removes its children — a menu item can't
    // survive without the item it hangs off of.
    setItems((list) => list.filter((i) => i.id !== deleteTarget.id && i.parentId !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateNavMenu(id, { items });
    toast({ title: 'Menu saved', description: menu?.name });
    setSaving(false);
  };

  if (!menu) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const ItemRow = ({ item, nested }) => (
    <div className={`flex items-center gap-3 py-3 ${nested ? 'pl-10' : 'pl-4'} pr-4 border-b border-border last:border-0`}>
      {nested && <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      <div className="flex flex-col shrink-0">
        <button type="button" onClick={() => moveItem(item, 'up')} aria-label="Move up" className="p-0.5 rounded hover:bg-secondary text-muted-foreground">
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => moveItem(item, 'down')} aria-label="Move down" className="p-0.5 rounded hover:bg-secondary text-muted-foreground">
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          {item.url || '—'} {item.openInNewTab && <ExternalLink className="w-3 h-3" />}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!nested && (
          <button type="button" onClick={() => openAdd(item.id)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" aria-label="Add sub-item">
            <Plus className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" aria-label="Edit item">
          <Pencil className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors" aria-label="Delete item">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={menu.name}
        description={`${menu.location} menu · ${items.length} item${items.length === 1 ? '' : 's'}`}
        backTo="/admin/cms/menus"
        backLabel="All Menus"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => openAdd(null)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Menu'}
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-border max-w-2xl overflow-hidden">
        {topLevel.length === 0 ? (
          <EmptyState icon={Plus} title="No items yet" description="Add the first link in this menu." />
        ) : (
          topLevel.map((item) => (
            <React.Fragment key={item.id}>
              <ItemRow item={item} nested={false} />
              {childrenOf(item.id).map((child) => <ItemRow key={child.id} item={child} nested />)}
            </React.Fragment>
          ))
        )}
      </div>

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editingId ? 'Edit Item' : 'Add Item'} onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1.5">Label</label>
          <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">URL</label>
          <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} className={inputClass} placeholder="/shop or https://…" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Icon</label>
          <Select value={form.icon || ''} onValueChange={(v) => setForm((f) => ({ ...f, icon: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              {ICON_CHOICES.map((i) => <SelectItem key={i || 'none'} value={i || 'none'}>{i || 'None'}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Nest Under</label>
          <Select
            value={form.parentId || 'none'}
            onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === 'none' ? null : v }))}
          >
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None (Top Level) —</SelectItem>
              {topLevel.filter((t) => t.id !== editingId).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between py-1">
          <label className="text-sm font-medium">Open in New Tab</label>
          <Switch checked={!!form.openInNewTab} onCheckedChange={(v) => setForm((f) => ({ ...f, openInNewTab: v }))} />
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this item?"
        description={deleteTarget ? `"${deleteTarget.label}"${childrenOf(deleteTarget.id).length ? ' and its sub-items' : ''} will be removed from this menu.` : ''}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default NavMenuEditor;
