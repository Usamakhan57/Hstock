import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { getContactSettings, updateContactSettings } from '../../api/contactSettings';
import { useToast } from '../../../hooks/use-toast';

const Card = ({ title, description, children }) => (
  <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const ContactSettingsCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getContactSettings().then(setForm); }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const updateHours = (id, key, value) => setForm((f) => ({ ...f, businessHours: f.businessHours.map((h) => (h.id === id ? { ...h, [key]: value } : h)) }));
  const removeHours = (id) => setForm((f) => ({ ...f, businessHours: f.businessHours.filter((h) => h.id !== id) }));
  const addHours = () => setForm((f) => ({ ...f, businessHours: [...(f.businessHours || []), { id: `bh-${Date.now()}`, day: '', hours: '' }] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateContactSettings(form);
      toast({ title: 'Contact settings saved', description: 'Contact page updates immediately.' });
    } catch (err) {
      toast({ title: 'Could not save contact settings', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Contact Settings"
        description="Company details shown on the Contact page. Saves to MongoDB and sync live to the storefront."
        actions={
          <button type="button" onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-5 max-w-2xl">
        <Card title="Company">
          <div>
            <label className="block text-sm font-medium mb-1.5">Company Name</label>
            <input value={form.companyName || ''} onChange={set('companyName')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Office</label>
            <input value={form.office || ''} onChange={set('office')} className={inputClass} placeholder="Remote-first support team" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Address</label>
            <textarea value={form.address || ''} onChange={set('address')} className={textareaClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Google Maps URL</label>
            <input value={form.googleMapsUrl || ''} onChange={set('googleMapsUrl')} className={inputClass} placeholder="Embed or share link" />
          </div>
        </Card>

        <Card title="Contact Methods">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input value={form.phone || ''} onChange={set('phone')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={form.email || ''} onChange={set('email')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">WhatsApp</label>
              <input value={form.whatsapp || ''} onChange={set('whatsapp')} className={inputClass} placeholder="Optional" />
            </div>
          </div>
        </Card>

        <Card title="Contact Form" description="Copy shown above the contact form on /contact.">
          <div>
            <label className="block text-sm font-medium mb-1.5">Form Title</label>
            <input value={form.formTitle || ''} onChange={set('formTitle')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Form Description</label>
            <textarea value={form.formDescription || ''} onChange={set('formDescription')} className={textareaClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Support Hours (summary)</label>
            <textarea value={form.supportHours || ''} onChange={set('supportHours')} className={textareaClass} />
          </div>
        </Card>

        <Card title="Business Hours">
          <div className="space-y-2">
            {(form.businessHours || []).map((h) => (
              <div key={h.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 bg-secondary/20">
                <input value={h.day} onChange={(e) => updateHours(h.id, 'day', e.target.value)} placeholder="Day(s)" className={`${inputClass} flex-1 min-w-[120px]`} />
                <input value={h.hours} onChange={(e) => updateHours(h.id, 'hours', e.target.value)} placeholder="Hours" className={`${inputClass} flex-1 min-w-[120px]`} />
                <button type="button" onClick={() => removeHours(h.id)} aria-label="Remove row" className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addHours} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </Card>
      </div>
    </div>
  );
};

export default ContactSettingsCms;
