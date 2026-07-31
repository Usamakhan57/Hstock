import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, PauseCircle, PlayCircle, Trash2, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import FormSheet, { inputClass } from '../../components/FormSheet';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customers';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = { name: '', email: '', phone: '', status: 'active' };
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const CustomersList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getCustomers().then((c) => { setCustomers(c); setLoading(false); }); };
  useEffect(load, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: 'Name and email are required', variant: 'destructive' }); return; }
    setSaving(true);
    await createCustomer({ ...form, totalOrders: 0, totalSpent: 0, joinedAt: new Date().toISOString() });
    toast({ title: 'Customer added', description: form.name });
    setSaving(false);
    setSheetOpen(false);
    setForm(EMPTY);
    load();
  };

  const toggleSuspend = async (row) => {
    const next = row.status === 'suspended' ? 'active' : 'suspended';
    await updateCustomer(row.id, { status: next });
    toast({ title: next === 'suspended' ? 'Customer suspended' : 'Customer activated', description: row.name });
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteCustomer(deleteTarget.id);
    toast({ title: 'Customer deleted', description: deleteTarget.name });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${customers.length} customers`}
        actions={
          <button onClick={() => setSheetOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        }
      />

      <DataTable
        isLoading={loading}
        data={customers}
        searchKeys={['name', 'email']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }] }]}
        onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
        columns={[
          { key: 'name', label: 'Customer', render: (row) => (<div><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.email}</p></div>) },
          { key: 'totalOrders', label: 'Orders' },
          { key: 'totalSpent', label: 'Total Spent', render: (row) => `$${row.totalSpent.toFixed(2)}` },
          { key: 'joinedAt', label: 'Joined', render: (row) => fmtDate(row.joinedAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'View Profile', icon: Eye, onClick: () => navigate(`/admin/customers/${row.id}`) },
          { label: row.status === 'suspended' ? 'Activate' : 'Suspend', icon: row.status === 'suspended' ? PlayCircle : PauseCircle, onClick: () => toggleSuspend(row) },
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: Users, title: 'No customers yet' }}
      />

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Add Customer" onSubmit={handleSubmit} submitting={saving}>
        <div>
          <label className="block text-sm font-medium mb-1.5">Full Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Phone</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
        </div>
      </FormSheet>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this customer?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default CustomersList;
