import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { Switch } from '../../../components/ui/switch';
import { getFooterCms, updateFooterCms } from '../../api/footerCms';
import { getNavMenus } from '../../api/navMenus';
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

const FooterCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [menus, setMenus] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFooterCms().then(setForm);
    getNavMenus().then(setMenus);
  }, []);

  const setNewsletter = (key) => (e) => setForm((f) => ({ ...f, newsletter: { ...f.newsletter, [key]: e?.target ? e.target.value : e } }));

  const updateSocial = (id, key, value) => setForm((f) => ({ ...f, socialLinks: f.socialLinks.map((s) => (s.id === id ? { ...s, [key]: value } : s)) }));
  const removeSocial = (id) => setForm((f) => ({ ...f, socialLinks: f.socialLinks.filter((s) => s.id !== id) }));
  const addSocial = () => setForm((f) => ({ ...f, socialLinks: [...f.socialLinks, { id: `soc-${Date.now()}`, platform: '', url: '' }] }));

  const togglePayment = (id, enabled) => setForm((f) => ({ ...f, paymentIcons: f.paymentIcons.map((p) => (p.id === id ? { ...p, enabled } : p)) }));

  const handleSave = async () => {
    setSaving(true);
    await updateFooterCms(form);
    toast({ title: 'Footer saved' });
    setSaving(false);
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const menuFor = (key) => menus.find((m) => m.key === key);

  return (
    <div>
      <PageHeader
        title="Footer"
        description="Branding, link columns, social icons, payment badges, and the newsletter block."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-5 max-w-2xl">
        <Card title="Branding">
          <ImageUploadInput label="Footer Logo" value={form.logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={textareaClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tagline</label>
            <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} className={inputClass} placeholder="Shown next to the copyright line" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Copyright Text</label>
            <input value={form.copyrightText} onChange={(e) => setForm((f) => ({ ...f, copyrightText: e.target.value }))} className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Use {'{year}'} to insert the current year automatically.</p>
          </div>
        </Card>

        <Card title="Footer Link Columns" description="Quick Links, Marketplace, Help, and Categories are each a Navigation Menu — edit their links there.">
          <div className="space-y-2">
            {Object.entries(form.columnMenuKeys).map(([column, key]) => (
              <div key={column} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium capitalize">{column}</p>
                  <p className="text-xs text-muted-foreground">{menuFor(key) ? `${menuFor(key).items.length} items` : 'Menu not found'}</p>
                </div>
                <Link to={menuFor(key) ? `/admin/cms/menus/${menuFor(key).id}` : '/admin/cms/menus'} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Edit <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Social Media">
          <div className="space-y-2">
            {form.socialLinks.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 bg-secondary/20">
                <input value={s.platform} onChange={(e) => updateSocial(s.id, 'platform', e.target.value)} placeholder="Platform" className={`${inputClass} flex-1 min-w-[100px]`} />
                <input value={s.url} onChange={(e) => updateSocial(s.id, 'url', e.target.value)} placeholder="URL" className={`${inputClass} flex-1 min-w-[140px]`} />
                <button type="button" onClick={() => removeSocial(s.id)} aria-label="Remove social link" className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSocial} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Social Link
          </button>
        </Card>

        <Card title="Payment Icons" description="Toggle which payment badges appear in the footer.">
          {form.paymentIcons.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <p className="text-sm font-medium">{p.name}</p>
              <Switch checked={p.enabled} onCheckedChange={(v) => togglePayment(p.id, v)} />
            </div>
          ))}
        </Card>

        <Card title="Newsletter">
          <div className="flex items-center justify-between py-1">
            <label className="text-sm font-medium">Show Newsletter Block</label>
            <Switch checked={form.newsletter.enabled} onCheckedChange={setNewsletter('enabled')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input value={form.newsletter.title} onChange={setNewsletter('title')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input value={form.newsletter.description} onChange={setNewsletter('description')} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Input Placeholder</label>
              <input value={form.newsletter.placeholder} onChange={setNewsletter('placeholder')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Button Label</label>
              <input value={form.newsletter.buttonLabel} onChange={setNewsletter('buttonLabel')} className={inputClass} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FooterCms;
