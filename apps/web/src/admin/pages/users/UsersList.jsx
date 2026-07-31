import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', email: '', role: 'Editor', status: 'invited' };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never';

const UsersList = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getUsers().then((u) => { setUsers(u); setLoading(false); }); };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm(row); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: 'Name and email are required', variant: 'destructive' }); return; }
    setSaving(true);
    if (editing) await updateUser(editing.id, form);
    else await createUser({ ...form, lastLoginAt: null });
    toast({ title: editing ? 'User updated' : 'User invited', description: form.name });
    setSaving(false);
    setSheetOpen(false);
    load();
  };

  const toggleSuspend = async (row) => {
    const next = row.status === 'suspended' ? 'active' : 'suspended';
    await updateUser(row.id, { status: next });
    toast({ title: next === 'suspended' ? 'User suspended' : 'User reactivated', description: row.name });
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteUser(deleteTarget.id);
    toast({ title: 'User removed', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description={`${users.length} admin users`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Invite User
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={users}
        searchKeys={['name', 'email']}
        filters={[
          { key: 'role', label: 'Role', options: [{ value: 'Admin', label: 'Admin' }, { value: 'Editor', label: 'Editor' }, { value: 'Support', label: 'Support' }] },
          { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'invited', label: 'Invited' }, { value: 'suspended', label: 'Suspended' }] },
        ]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'name', label: 'User', render: (row) => (
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full brand-gradient text-white grid place-items-center text-xs font-bold shrink-0">
                  {row.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
              </div>
            ),
          },
          { key: 'role', label: 'Role' },
          { key: 'lastLoginAt', label: 'Last Login', render: (row) => fmtDate(row.lastLoginAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
          { label: row.status === 'suspended' ? 'Reactivate' : 'Suspend', icon: ShieldCheck, onClick: () => toggleSuspend(row) },
          { separator: true },
          { label: 'Remove', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ title: 'No admin users yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit User' : 'Invite User'} onSubmit={handleSubmit} submitting={saving}>
        <div>
          <label className="block text-sm font-medium mb-1.5">Full Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin — full access</SelectItem>
              <SelectItem value="Editor">Editor — catalog & content</SelectItem>
              <SelectItem value="Support">Support — orders & customers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Remove this user?"
        description={deleteTarget ? `"${deleteTarget.name}" will lose access to the admin panel.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default UsersList;
