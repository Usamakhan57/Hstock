import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { inputClass } from '../../components/FormSheet';
import { getSocialSettings, updateSocialSettings } from '../../api/socialSettings';
import { useToast } from '../../../hooks/use-toast';

const FIELDS = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'tiktok', label: 'TikTok', icon: null },
  { key: 'pinterest', label: 'Pinterest', icon: null },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'x', label: 'X (Twitter)', icon: null },
];

const SocialSettingsCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSocialSettings().then(setForm); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSocialSettings(form);
      toast({ title: 'Social settings saved' });
    } catch (err) {
      toast({ title: 'Could not save social settings', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Social Settings"
        description="The storefront's own social profile links — the canonical URL per platform."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
        {FIELDS.map(({ key, label, icon: Icon }) => (
          <div key={key}>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />} {label}
            </label>
            <input
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className={inputClass}
              placeholder={`https://${key}.com/apnastore`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialSettingsCms;
