import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import MediaPickerField from '../../../components/media/MediaPickerField';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Switch } from '../../../components/ui/switch';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getBlogSettings, updateBlogSettings } from '../../api/blogSettings';
import { getBlogCategories } from '../../api/blogCategories';
import { getBlogAuthors } from '../../api/blogAuthors';
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

const BlogSettings = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBlogSettings().then(setForm);
    getBlogCategories().then(setCategories);
    getBlogAuthors().then(setAuthors);
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const toggleFeaturedCategory = (id) => {
    setForm((f) => ({
      ...f,
      featuredCategoryIds: f.featuredCategoryIds.includes(id)
        ? f.featuredCategoryIds.filter((c) => c !== id)
        : [...f.featuredCategoryIds, id],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateBlogSettings(form);
    toast({ title: 'Blog settings saved' });
    setSaving(false);
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Blog Settings"
        description="Controls the live Blog page — nothing here requires a frontend code change."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <Tabs defaultValue="general">
        <TabsList className="bg-white border border-border rounded-full p-1.5 h-auto mb-6 flex-wrap">
          <TabsTrigger value="general" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">General</TabsTrigger>
          <TabsTrigger value="display" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">Display</TabsTrigger>
          <TabsTrigger value="labels" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">Labels</TabsTrigger>
          <TabsTrigger value="seo" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">Default SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-1.5">Blog Page Title</label>
              <input value={form.pageTitle} onChange={set('pageTitle')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Hero Heading</label>
              <input value={form.heroHeading} onChange={set('heroHeading')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Hero Description</label>
              <textarea value={form.heroDescription} onChange={set('heroDescription')} className={textareaClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default Author</label>
              <Select value={form.defaultAuthorId} onValueChange={set('defaultAuthorId')}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select author" /></SelectTrigger>
                <SelectContent>
                  {authors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Pre-fills Author when adding a new post.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="display">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
            <div>
              <p className="text-sm font-medium mb-2">Featured Categories</p>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-xl border border-border p-3">
                {categories.length === 0 && <p className="text-xs text-muted-foreground">No categories yet.</p>}
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.featuredCategoryIds.includes(c.id)} onCheckedChange={() => toggleFeaturedCategory(c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Shown as quick filters at the top of the Blog page.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Posts Per Page</label>
              <input type="number" min="3" max="30" value={form.postsPerPage} onChange={set('postsPerPage')} className={inputClass} />
            </div>
            <div className="pt-1">
              <ToggleRow label="Enable Search" description="Show the search box on the Blog page." checked={form.enableSearch} onChange={(v) => setForm((f) => ({ ...f, enableSearch: v }))} />
              <ToggleRow label="Enable Categories" description="Show category filter pills on the Blog page." checked={form.enableCategories} onChange={(v) => setForm((f) => ({ ...f, enableCategories: v }))} />
              <ToggleRow label="Enable Related Posts" description="Show related posts at the end of each article." checked={form.enableRelatedPosts} onChange={(v) => setForm((f) => ({ ...f, enableRelatedPosts: v }))} />
              <ToggleRow label="Enable Newsletter" description="Show the newsletter signup block on the Blog page." checked={form.enableNewsletter} onChange={(v) => setForm((f) => ({ ...f, enableNewsletter: v }))} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="labels">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
            <p className="text-xs text-muted-foreground -mt-1">Every user-facing label on the Blog page — nothing is hardcoded in the frontend.</p>
            <div>
              <label className="block text-sm font-medium mb-1.5">Search Placeholder</label>
              <input value={form.searchPlaceholder} onChange={set('searchPlaceholder')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">"All Categories" Pill Label</label>
              <input value={form.allCategoriesLabel} onChange={set('allCategoriesLabel')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Featured Section Heading</label>
              <input value={form.featuredSectionHeading} onChange={set('featuredSectionHeading')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">No Results Title</label>
              <input value={form.noResultsTitle} onChange={set('noResultsTitle')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">No Results Description</label>
              <input value={form.noResultsDescription} onChange={set('noResultsDescription')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">"Load More" Button Label</label>
              <input value={form.loadMoreButtonLabel} onChange={set('loadMoreButtonLabel')} className={inputClass} />
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-2">Newsletter Block</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Heading</label>
                  <input value={form.newsletterHeading} onChange={set('newsletterHeading')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <input value={form.newsletterDescription} onChange={set('newsletterDescription')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email Placeholder</label>
                  <input value={form.newsletterPlaceholder} onChange={set('newsletterPlaceholder')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Button Label</label>
                  <input value={form.newsletterButtonLabel} onChange={set('newsletterButtonLabel')} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
            <MediaPickerField label="Default OG Image" value={form.defaultOgImage} onChange={(v) => setForm((f) => ({ ...f, defaultOgImage: v }))} modalTitle="Select Default OG Image" />
            <div>
              <label className="block text-sm font-medium mb-1.5">Default SEO Title</label>
              <input value={form.defaultSeoTitle} onChange={set('defaultSeoTitle')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default Meta Description</label>
              <textarea value={form.defaultMetaDescription} onChange={set('defaultMetaDescription')} className={textareaClass} />
            </div>
            <p className="text-xs text-muted-foreground">Used as a fallback whenever an individual post leaves its SEO fields blank.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogSettings;
