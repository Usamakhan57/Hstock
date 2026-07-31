import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getGlobalSettings, updateGlobalSettings } from '../../api/globalSettings';
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

const ColorField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-11 h-10 rounded-lg border border-border cursor-pointer" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  </div>
);

const GlobalSettingsCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getGlobalSettings().then(setForm); }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const handleSave = async () => {
    setSaving(true);
    await updateGlobalSettings(form);
    toast({ title: 'Global settings saved' });
    setSaving(false);
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Global Settings"
        description="Brand identity, colors, typography, and locale defaults for the whole storefront."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-5 max-w-2xl">
        <Card title="Branding">
          <div>
            <label className="block text-sm font-medium mb-1.5">Site Name</label>
            <input value={form.siteName} onChange={set('siteName')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tagline</label>
            <input value={form.tagline} onChange={set('tagline')} className={inputClass} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ImageUploadInput label="Logo" value={form.logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
            <ImageUploadInput label="Favicon" value={form.favicon} onChange={(v) => setForm((f) => ({ ...f, favicon: v }))} />
          </div>
        </Card>

        <Card title="Colors">
          <div className="grid sm:grid-cols-2 gap-4">
            <ColorField label="Primary Color" value={form.primaryColor} onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))} />
            <ColorField label="Secondary Color" value={form.secondaryColor} onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))} />
          </div>
        </Card>

        <Card title="Typography">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Heading Font</label>
              <input value={form.headingFont} onChange={set('headingFont')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Body Font</label>
              <input value={form.bodyFont} onChange={set('bodyFont')} className={inputClass} />
            </div>
          </div>
        </Card>

        <Card title="Locale">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Timezone</label>
              <input value={form.timezone} onChange={set('timezone')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Language</label>
              <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Currency</label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="PKR">PKR (₨)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Measurement Units</label>
              <Select value={form.measurementUnit} onValueChange={(v) => setForm((f) => ({ ...f, measurementUnit: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Inches</SelectItem>
                  <SelectItem value="cm">Centimeters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GlobalSettingsCms;
