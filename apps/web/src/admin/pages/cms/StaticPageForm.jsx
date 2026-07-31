import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import RichTextEditorPlaceholder from '../../../components/blog/RichTextEditorPlaceholder';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getStaticPage, updateStaticPage } from '../../api/staticPages';
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

const StaticPageForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getStaticPage(id).then(setForm); }, [id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const handleSave = async () => {
    setSaving(true);
    await updateStaticPage(id, form);
    toast({ title: 'Page saved', description: form.title });
    setSaving(false);
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={form.title}
        description={`/${form.slug}`}
        backTo="/admin/cms/pages"
        backLabel="All Pages"
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
              <label className="block text-sm font-medium mb-1.5">Page Title</label>
              <input value={form.title} onChange={set('title')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">URL Slug</label>
              <input value={form.slug} onChange={set('slug')} className={inputClass} />
              <p className="text-xs text-muted-foreground mt-1">Shown to visitors as apnastore.org/{form.slug}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Body</label>
              <RichTextEditorPlaceholder value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} placeholder="Write the page content…" />
            </div>
          </SectionCard>

          <SectionCard title="SEO">
            <div>
              <label className="block text-sm font-medium mb-1.5">SEO Title</label>
              <input value={form.seoTitle} onChange={set('seoTitle')} className={inputClass} placeholder="Defaults to the page title if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Meta Description</label>
              <textarea value={form.metaDescription} onChange={set('metaDescription')} className={textareaClass} />
            </div>
            <ImageUploadInput label="OG Image" value={form.ogImage} onChange={(v) => setForm((f) => ({ ...f, ogImage: v }))} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Status">
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </SectionCard>

          <SectionCard title="Featured Image">
            <ImageUploadInput label="" value={form.featuredImage} onChange={(v) => setForm((f) => ({ ...f, featuredImage: v }))} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StaticPageForm;
