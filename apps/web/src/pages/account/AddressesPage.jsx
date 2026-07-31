import React, { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, CheckCircle2 } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { defaultAddresses, loadLS, saveLS, uid } from '../../services/buyerDashboard';

const KEY = 'pm_addresses';
const emptyForm = { type: 'billing', label: '', fullName: '', line1: '', city: '', state: '', postalCode: '', country: '', phone: '' };

const AddressModal = ({ open, onOpenChange, onSave, editing }) => {
  const [form, setForm] = useState(editing || emptyForm);

  React.useEffect(() => { setForm(editing || emptyForm); }, [editing, open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: editing?.id || uid('addr'), isDefault: editing?.isDefault || false });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>{editing ? 'Edit Detail' : 'Add Detail'}</DialogTitle>
        <DialogDescription className="sr-only">Add or edit a digital access detail.</DialogDescription>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Type</label>
              <select value={form.type} onChange={set('type')} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary">
                <option value="billing">Billing</option>
                <option value="shipping">Shipping</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Label</label>
              <input value={form.label} onChange={set('label')} placeholder="Home, Office…" className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Full name</label>
            <input value={form.fullName} onChange={set('fullName')} required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Address</label>
            <input value={form.line1} onChange={set('line1')} required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">City</label>
              <input value={form.city} onChange={set('city')} required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">State/Province</label>
              <input value={form.state} onChange={set('state')} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Postal code</label>
              <input value={form.postalCode} onChange={set('postalCode')} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Country</label>
              <input value={form.country} onChange={set('country')} required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Phone</label>
            <input value={form.phone} onChange={set('phone')} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
          </div>
          <button type="submit" className="brand-gradient text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-95 transition-all w-full">
            {editing ? 'Save Changes' : 'Add Address'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddressesPage = () => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState(() => loadLS(KEY, null) || defaultAddresses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const persist = (next) => { setAddresses(next); saveLS(KEY, next); };

  const handleSave = (addr) => {
    const exists = addresses.some((a) => a.id === addr.id);
    persist(exists ? addresses.map((a) => (a.id === addr.id ? addr : a)) : [...addresses, addr]);
    toast({ title: exists ? 'Address updated' : 'Address added' });
    setEditing(null);
  };

  const handleDelete = (id) => {
    persist(addresses.filter((a) => a.id !== id));
    toast({ title: 'Address removed' });
  };

  const makeDefault = (id) => {
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    toast({ title: 'Default address updated' });
  };

  return (
    <>
      <Seo title="Digital Access Details" description="Manage your saved account details for digital deliveries." noIndex />
      <AccountLayout title="Access Details" subtitle="Optional contact details for support and account handoff.">
        <div className="flex justify-end mb-5">
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity">
            <Plus className="w-4 h-4" /> Add Detail
          </button>
        </div>

        {addresses.length === 0 ? (
          <EmptyState title="No access details saved" message="Add a contact or handoff detail to keep support and account delivery organized." actionLabel="Add Detail" actionTo="#" onSecondary={() => setModalOpen(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="bg-white rounded-3xl border border-border soft-shadow p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-secondary grid place-items-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{a.label || (a.type === 'billing' ? 'Billing' : 'Support')}</p>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{a.type}</span>
                    </div>
                  </div>
                  {a.isDefault && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Default</span>}
                </div>
                <p className="text-sm font-medium">{a.fullName}</p>
                <p className="text-sm text-muted-foreground">{a.line1}</p>
                <p className="text-sm text-muted-foreground">{a.city}{a.state ? `, ${a.state}` : ''} {a.postalCode}</p>
                <p className="text-sm text-muted-foreground">{a.country}</p>
                {a.phone && <p className="text-sm text-muted-foreground mt-1">{a.phone}</p>}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                  <button onClick={() => { setEditing(a); setModalOpen(true); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  {!a.isDefault && (
                    <button onClick={() => makeDefault(a.id)} className="text-xs font-semibold text-muted-foreground hover:text-foreground ml-auto">Make Default</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <AddressModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSave} editing={editing} />
      </AccountLayout>
    </>
  );
};

export default AddressesPage;
