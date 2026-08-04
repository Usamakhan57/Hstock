import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { inputClass } from '../../components/FormSheet';
import RichTextEditorPlaceholder from '../../../components/blog/RichTextEditorPlaceholder';
import { Switch } from '../../../components/ui/switch';
import { getEmailTemplate, updateEmailTemplate } from '../../api/emailTemplates';
import { useToast } from '../../../hooks/use-toast';

const SectionCard = ({ title, description, children }) => (
  <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const EmailTemplateForm = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getEmailTemplate(id).then(setForm); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEmailTemplate(id, form);
      toast({ title: 'Template saved', description: form.name });
    } catch (err) {
      toast({ title: 'Could not save template', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const tokens = [...form.subject.matchAll(/{(\w+)}/g), ...form.body.matchAll(/{(\w+)}/g)].map((m) => m[1]);
  const uniqueTokens = [...new Set(tokens)];

  return (
    <div>
      <PageHeader
        title={form.name}
        backTo="/admin/cms/email-templates"
        backLabel="All Templates"
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Content">
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject Line</label>
              <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Body</label>
              <RichTextEditorPlaceholder value={form.body} onChange={(v) => setForm((f) => ({ ...f, body: v }))} />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Status">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Enabled</p>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
            </div>
            <p className="text-xs text-muted-foreground">Disabled templates won't be sent once the backend is connected.</p>
          </SectionCard>

          {uniqueTokens.length > 0 && (
            <SectionCard title="Merge Tokens" description="Replaced automatically when the email sends.">
              <div className="flex flex-wrap gap-1.5">
                {uniqueTokens.map((t) => (
                  <code key={t} className="text-xs bg-secondary/60 px-2 py-1 rounded-md">{`{${t}}`}</code>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateForm;
