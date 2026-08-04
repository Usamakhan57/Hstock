import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass } from '../../components/FormSheet';
import { getNewsletterCms, updateNewsletterCms } from '../../api/newsletterCms';
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

const NewsletterCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getNewsletterCms().then(setForm); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNewsletterCms(form);
      toast({ title: 'Newsletter settings saved' });
    } catch (err) {
      toast({ title: 'Could not save newsletter', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Newsletter"
        description="Shared appearance and confirmation copy for the newsletter block, wherever it's shown."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-5 max-w-2xl">
        <Card title="Titles & Enable/Disable" description="The homepage section and footer block each control their own title, subtitle, and on/off switch.">
          <Link to="/admin/cms/homepage" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Edit Homepage newsletter section <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link to="/admin/cms/footer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Edit Footer newsletter block <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card title="Background">
          <ImageUploadInput label="Background Image" value={form.backgroundImage} onChange={(v) => setForm((f) => ({ ...f, backgroundImage: v }))} />
        </Card>

        <Card title="Confirmation">
          <div>
            <label className="block text-sm font-medium mb-1.5">Success Message</label>
            <input value={form.successMessage} onChange={(e) => setForm((f) => ({ ...f, successMessage: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Disclaimer Text</label>
            <input value={form.disclaimerText} onChange={(e) => setForm((f) => ({ ...f, disclaimerText: e.target.value }))} className={inputClass} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewsletterCms;
