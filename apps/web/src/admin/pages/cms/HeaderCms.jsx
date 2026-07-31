import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass } from '../../components/FormSheet';
import { Switch } from '../../../components/ui/switch';
import { getHeaderCms, updateHeaderCms } from '../../api/headerCms';
import { useToast } from '../../../hooks/use-toast';

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const Card = ({ title, description, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-border p-5 space-y-4 ${className}`}>
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const HeaderCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getHeaderCms().then(setForm); }, []);

  const setNested = (section, key) => (e) => setForm((f) => ({
    ...f,
    [section]: { ...f[section], [key]: e?.target ? e.target.value : e },
  }));

  const handleSave = async () => {
    setSaving(true);
    await updateHeaderCms(form);
    toast({ title: 'Header saved' });
    setSaving(false);
  };

  const addButton = () => setForm((f) => ({
    ...f,
    headerButtons: [...f.headerButtons, { id: `hb-${Date.now()}`, label: '', url: '', openInNewTab: false }],
  }));
  const updateButton = (id, key, value) => setForm((f) => ({
    ...f,
    headerButtons: f.headerButtons.map((b) => (b.id === id ? { ...b, [key]: value } : b)),
  }));
  const removeButton = (id) => setForm((f) => ({ ...f, headerButtons: f.headerButtons.filter((b) => b.id !== id) }));

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Header"
        description="Logo, top bars, search, and the buttons shown on the right of the header."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-5 max-w-2xl">
        <Card title="Branding & Behavior">
          <ImageUploadInput label="Logo" value={form.logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
          <div>
            <label className="block text-sm font-medium mb-1.5">Search Placeholder</label>
            <input value={form.searchPlaceholder} onChange={(e) => setForm((f) => ({ ...f, searchPlaceholder: e.target.value }))} className={inputClass} />
          </div>
          <ToggleRow label="Sticky Header" description="Keep the header pinned to the top while scrolling." checked={form.stickyHeader} onChange={(v) => setForm((f) => ({ ...f, stickyHeader: v }))} />
          <ToggleRow label="Mega Menu" description="Show the full category mega menu on hover/click." checked={form.megaMenuEnabled} onChange={(v) => setForm((f) => ({ ...f, megaMenuEnabled: v }))} />
        </Card>

        <Card title="Navigation" description="The links shown in the header's main nav are managed as a Navigation Menu.">
          <Link to="/admin/cms/menus" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Edit Header Navigation menu <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card title="Top Bar" description="A slim bar above the header, e.g. a shipping or delivery message.">
          <ToggleRow label="Enable Top Bar" checked={form.topBar.enabled} onChange={setNested('topBar', 'enabled')} />
          <div>
            <label className="block text-sm font-medium mb-1.5">Text</label>
            <input value={form.topBar.text} onChange={setNested('topBar', 'text')} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Link Text</label>
              <input value={form.topBar.linkText} onChange={setNested('topBar', 'linkText')} className={inputClass} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Link URL</label>
              <input value={form.topBar.linkUrl} onChange={setNested('topBar', 'linkUrl')} className={inputClass} placeholder="Optional" />
            </div>
          </div>
        </Card>

        <Card title="Announcement Bar" description="A dismissible promo bar, e.g. a sale callout.">
          <ToggleRow label="Enable Announcement Bar" checked={form.announcementBar.enabled} onChange={setNested('announcementBar', 'enabled')} />
          <div>
            <label className="block text-sm font-medium mb-1.5">Text</label>
            <input value={form.announcementBar.text} onChange={setNested('announcementBar', 'text')} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Button Text</label>
              <input value={form.announcementBar.linkText} onChange={setNested('announcementBar', 'linkText')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Button URL</label>
              <input value={form.announcementBar.linkUrl} onChange={setNested('announcementBar', 'linkUrl')} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Background Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.announcementBar.backgroundColor} onChange={setNested('announcementBar', 'backgroundColor')} className="w-11 h-10 rounded-lg border border-border cursor-pointer" />
              <input value={form.announcementBar.backgroundColor} onChange={setNested('announcementBar', 'backgroundColor')} className={inputClass} />
            </div>
          </div>
        </Card>

        <Card title="Become a Seller Button">
          <ToggleRow label="Show Button" checked={form.becomeSellerButton.enabled} onChange={setNested('becomeSellerButton', 'enabled')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Button Text</label>
              <input value={form.becomeSellerButton.text} onChange={setNested('becomeSellerButton', 'text')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Button URL</label>
              <input value={form.becomeSellerButton.url} onChange={setNested('becomeSellerButton', 'url')} className={inputClass} />
            </div>
          </div>
        </Card>

        <Card title="Header Buttons" description="Extra custom buttons shown alongside Become a Seller.">
          <div className="space-y-2">
            {form.headerButtons.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 bg-secondary/20">
                <input value={b.label} onChange={(e) => updateButton(b.id, 'label', e.target.value)} placeholder="Label" className={`${inputClass} flex-1 min-w-[100px]`} />
                <input value={b.url} onChange={(e) => updateButton(b.id, 'url', e.target.value)} placeholder="URL" className={`${inputClass} flex-1 min-w-[100px]`} />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Switch checked={!!b.openInNewTab} onCheckedChange={(v) => updateButton(b.id, 'openInNewTab', v)} /> New tab
                </label>
                <button type="button" onClick={() => removeButton(b.id)} aria-label="Remove button" className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addButton} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Button
          </button>
        </Card>
      </div>
    </div>
  );
};

export default HeaderCms;
