import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ListTree } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getNavMenus, createNavMenu, updateNavMenu, deleteNavMenu } from '../../api/navMenus';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', key: '', location: 'Custom' };

const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const NavMenusList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getNavMenus().then((m) => { setMenus(m); setLoading(false); }); };
  useEffect(load, []);

  const openAdd = () => { setForm(EMPTY); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: 'Menu name is required', variant: 'destructive' }); return; }
    setSaving(true);
    await createNavMenu({ name: form.name, key: form.key || slugify(form.name), location: form.location, items: [] });
    toast({ title: 'Menu created', description: form.name });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteNavMenu(deleteTarget.id);
    toast({ title: 'Menu deleted', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Navigation Menus"
        description="Build the link structures used across the header and footer."
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Menu
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={menus}
        searchKeys={['name']}
        filters={[{ key: 'location', label: 'Location', options: [{ value: 'Header', label: 'Header' }, { value: 'Footer', label: 'Footer' }, { value: 'Custom', label: 'Custom' }] }]}
        onRowClick={(row) => navigate(`/admin/cms/menus/${row.id}`)}
        columns={[
          { key: 'name', label: 'Menu', render: (row) => <p className="font-medium">{row.name}</p> },
          { key: 'key', label: 'Key', render: (row) => <code className="text-xs text-muted-foreground">{row.key}</code> },
          { key: 'location', label: 'Location' },
          { key: 'items', label: 'Items', render: (row) => `${(row.items || []).length} item${(row.items || []).length === 1 ? '' : 's'}` },
        ]}
        rowActions={(row) => [
          { label: 'Edit Items', icon: Pencil, onClick: () => navigate(`/admin/cms/menus/${row.id}`) },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: ListTree, title: 'No menus yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Add Menu" onSubmit={handleSubmit} submitting={saving}>
        <div>
          <label className="block text-sm font-medium mb-1.5">Menu Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Footer — Resources" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Location</label>
          <Select value={form.location} onValueChange={(v) => setForm((f) => ({ ...f, location: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Header">Header</SelectItem>
              <SelectItem value="Footer">Footer</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this menu?"
        description={deleteTarget ? `"${deleteTarget.name}" and its items will be permanently removed. Anything referencing its key (e.g. a footer column) will show no links until reassigned.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default NavMenusList;
