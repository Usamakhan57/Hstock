import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { useToast } from '../../../hooks/use-toast';
import { useAdminAuth } from '../../AdminAuthContext';
import { isSuperAdmin } from '../../../context/AuthRoles';

const EMPTY = { name: '', email: '', role: 'Editor', status: 'invited' };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never');

const UsersList = () => {
  const { toast } = useToast();
  const { admin } = useAdminAuth();
  const canDeleteUsers = isSuperAdmin(admin);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      toast({
        title: 'Unable to load users',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setSheetOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm(row); setSheetOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Name and email are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateUser(editing.id, form);
      else await createUser({ ...form, lastLoginAt: null });
      toast({
        title: editing ? 'User updated' : 'User invited',
        description: editing
          ? form.name
          : `${form.name} — invite email sent to ${form.email}`,
      });
      setSheetOpen(false);
      await load();
    } catch (err) {
      toast({
        title: editing ? 'Could not update user' : 'Could not invite user',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async (row) => {
    try {
      const next = row.status === 'suspended' ? 'active' : 'suspended';
      await updateUser(row.id, { status: next });
      toast({ title: next === 'suspended' ? 'User suspended' : 'User reactivated', description: row.name });
      await load();
    } catch (err) {
      toast({ title: 'Could not update user', description: err.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const resetDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteConfirm('');
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== 'DELETE' || busy) return;
    const removedId = deleteTarget.id;
    const removedName = deleteTarget.name;
    setBusy(true);
    try {
      await deleteUser(removedId, { confirm: 'DELETE' });
      toast({ title: 'User removed', description: removedName });
      resetDeleteModal();
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(removedId)));
      await load();
    } catch (err) {
      toast({ title: 'Could not remove user', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description={`${users.length} admin users`}
        actions={(
          <button type="button" onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Invite User
          </button>
        )}
      />

      <DataTable
        isLoading={loading}
        data={users}
        searchKeys={['name', 'email']}
        filters={[
          { key: 'role', label: 'Role', options: [{ value: 'Admin', label: 'Admin' }, { value: 'Editor', label: 'Editor' }, { value: 'Support', label: 'Support' }, { value: 'Super Admin', label: 'Super Admin' }] },
          { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'invited', label: 'Invited' }, { value: 'suspended', label: 'Suspended' }] },
        ]}
        onRowClick={openEdit}
        columns={[
          {
            key: 'name',
            label: 'User',
            render: (row) => (
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full brand-gradient text-white grid place-items-center text-xs font-bold shrink-0">
                  {(row.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
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
          ...(canDeleteUsers ? [
            { separator: true },
            {
              label: 'Remove',
              icon: Trash2,
              destructive: true,
              onClick: () => {
                setDeleteTarget(row);
                setDeleteConfirm('');
              },
            },
          ] : []),
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (busy) return;
          if (!open) resetDeleteModal();
        }}
      >
        <DialogContent className="max-w-[440px] rounded-[24px] border border-border bg-background p-0 overflow-hidden">
          <div className="px-6 py-6">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-red-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="mt-4 text-xl font-bold">Remove this user?</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              {deleteTarget
                ? `"${deleteTarget.name}" will lose access to the admin panel. Type DELETE to confirm.`
                : 'Type DELETE to confirm.'}
            </DialogDescription>
            <label className="mt-4 block text-sm font-medium mb-1.5">
              Type DELETE to continue
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className={inputClass}
              placeholder="DELETE"
              disabled={busy}
              autoComplete="off"
            />
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={resetDeleteModal}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || deleteConfirm !== 'DELETE'}
                onClick={handleDelete}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersList;
