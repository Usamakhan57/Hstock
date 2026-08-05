import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { Switch } from '../../../components/ui/switch';
import { getFooterCms, updateFooterCms } from '../../api/footerCms';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFooterCms().then(setForm);
  }, []);

  const setNewsletter = (key) => (e) => setForm((f) => ({
    ...f,
    newsletter: { ...f.newsletter, [key]: e?.target ? e.target.value : e },
  }));

  const updateSocial = (id, key, value) => setForm((f) => ({
    ...f,
    socialLinks: (f.socialLinks || []).map((s) => (s.id === id ? { ...s, [key]: value } : s)),
  }));
  const removeSocial = (id) => setForm((f) => ({
    ...f,
    socialLinks: (f.socialLinks || []).filter((s) => s.id !== id),
  }));
  const addSocial = () => setForm((f) => ({
    ...f,
    socialLinks: [...(f.socialLinks || []), { id: `soc-${Date.now()}`, platform: '', url: '' }],
  }));

  const togglePayment = (id, enabled) => setForm((f) => ({
    ...f,
    paymentIcons: (f.paymentIcons || []).map((p) => (p.id === id ? { ...p, enabled } : p)),
  }));

  const updateColumnTitle = (colIdx, title) => setForm((f) => ({
    ...f,
    columns: f.columns.map((c, i) => (i === colIdx ? { ...c, title } : c)),
  }));

  const updateLink = (colIdx, linkIdx, key, value) => setForm((f) => ({
    ...f,
    columns: f.columns.map((c, i) => {
      if (i !== colIdx) return c;
      return {
        ...c,
        links: c.links.map((l, j) => (j === linkIdx ? { ...l, [key]: value } : l)),
      };
    }),
  }));

  const addLink = (colIdx) => setForm((f) => ({
    ...f,
    columns: f.columns.map((c, i) => (
      i === colIdx ? { ...c, links: [...(c.links || []), { name: '', to: '/' }] } : c
    )),
  }));

  const removeLink = (colIdx, linkIdx) => setForm((f) => ({
    ...f,
    columns: f.columns.map((c, i) => (
      i === colIdx ? { ...c, links: c.links.filter((_, j) => j !== linkIdx) } : c
    )),
  }));

  const addColumn = () => setForm((f) => ({
    ...f,
    columns: [...(f.columns || []), { title: 'New Column', links: [] }],
  }));

  const removeColumn = (colIdx) => setForm((f) => ({
    ...f,
    columns: f.columns.filter((_, i) => i !== colIdx),
  }));

  const updateBadge = (id, label) => setForm((f) => ({
    ...f,
    bottomBadges: (f.bottomBadges || []).map((b) => (b.id === id ? { ...b, label } : b)),
  }));
  const addBadge = () => setForm((f) => ({
    ...f,
    bottomBadges: [...(f.bottomBadges || []), { id: `badge-${Date.now()}`, label: '' }],
  }));
  const removeBadge = (id) => setForm((f) => ({
    ...f,
    bottomBadges: (f.bottomBadges || []).filter((b) => b.id !== id),
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updateFooterCms({
        ...form,
        footerContentVersion: Math.max(2, Number(form.footerContentVersion) || 2),
      });
      setForm((f) => ({ ...f, ...(saved || {}) }));
      toast({ title: 'Footer saved' });
    } catch (err) {
      toast({
        title: 'Could not save footer',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Footer"
        description="All storefront footer copy, columns, newsletter, and bottom badges. Saving updates the live site immediately."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-5 max-w-2xl">
        <Card title="Branding">
          <ImageUploadInput label="Footer Logo" value={form.logo || ''} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={textareaClass}
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Copyright Text</label>
            <textarea
              value={form.copyrightText || ''}
              onChange={(e) => setForm((f) => ({ ...f, copyrightText: e.target.value }))}
              className={textareaClass}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Use {'{year}'} to insert the current year automatically.</p>
          </div>
        </Card>

        <Card title="Bottom Badges" description="Shown on the right side of the copyright bar.">
          <div className="space-y-2">
            {(form.bottomBadges || []).map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <input
                  value={b.label || ''}
                  onChange={(e) => updateBadge(b.id, e.target.value)}
                  className={inputClass}
                  placeholder="Badge label"
                />
                <button
                  type="button"
                  onClick={() => removeBadge(b.id)}
                  aria-label="Remove badge"
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addBadge}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Badge
          </button>
        </Card>

        <Card title="Footer Link Columns" description="Marketplace, Resources, and Legal — edited here and published on Save.">
          <div className="space-y-5">
            {(form.columns || []).map((col, colIdx) => (
              <div key={`col-${colIdx}`} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    value={col.title || ''}
                    onChange={(e) => updateColumnTitle(colIdx, e.target.value)}
                    className={inputClass}
                    placeholder="Column title"
                  />
                  <button
                    type="button"
                    onClick={() => removeColumn(colIdx)}
                    aria-label="Remove column"
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(col.links || []).map((link, linkIdx) => (
                    <div key={`link-${colIdx}-${linkIdx}`} className="flex flex-wrap items-center gap-2">
                      <input
                        value={link.name || ''}
                        onChange={(e) => updateLink(colIdx, linkIdx, 'name', e.target.value)}
                        placeholder="Label"
                        className={`${inputClass} flex-1 min-w-[100px]`}
                      />
                      <input
                        value={link.to || link.url || ''}
                        onChange={(e) => updateLink(colIdx, linkIdx, 'to', e.target.value)}
                        placeholder="/path"
                        className={`${inputClass} flex-1 min-w-[120px]`}
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(colIdx, linkIdx)}
                        aria-label="Remove link"
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addLink(colIdx)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add link
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Column
          </button>
        </Card>

        <Card title="Social Media">
          <div className="space-y-2">
            {(form.socialLinks || []).map((s) => (
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

        {(form.paymentIcons || []).length > 0 && (
          <Card title="Payment Icons" description="Toggle which payment badges are stored in CMS (optional).">
            {form.paymentIcons.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <p className="text-sm font-medium">{p.name}</p>
                <Switch checked={p.enabled} onCheckedChange={(v) => togglePayment(p.id, v)} />
              </div>
            ))}
          </Card>
        )}

        <Card title="Newsletter">
          <div className="flex items-center justify-between py-1">
            <label className="text-sm font-medium">Show Newsletter Block</label>
            <Switch checked={form.newsletter?.enabled !== false} onCheckedChange={setNewsletter('enabled')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input value={form.newsletter?.title || ''} onChange={setNewsletter('title')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input value={form.newsletter?.description || ''} onChange={setNewsletter('description')} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Input Placeholder</label>
              <input value={form.newsletter?.placeholder || ''} onChange={setNewsletter('placeholder')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Button Label</label>
              <input value={form.newsletter?.buttonLabel || ''} onChange={setNewsletter('buttonLabel')} className={inputClass} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FooterCms;
