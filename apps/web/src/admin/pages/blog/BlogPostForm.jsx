import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, History } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import MediaPickerField from '../../../components/media/MediaPickerField';
import { inputClass, textareaClass } from '../../components/FormSheet';
import RichTextEditorPlaceholder from '../../../components/blog/RichTextEditorPlaceholder';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { Switch } from '../../../components/ui/switch';
import { getBlogPost, createBlogPost, updateBlogPost } from '../../api/blogPosts';
import { getBlogCategories } from '../../api/blogCategories';
import { getBlogTags } from '../../api/blogTags';
import { getBlogAuthors } from '../../api/blogAuthors';
import { getBlogSettings } from '../../api/blogSettings';
import { getBlogRevisionsForPost } from '../../api/blogRevisions';
import { buildBlogPostingSchema } from '../../../services/blog/seoUtils';
import { useAdminAuth } from '../../AdminAuthContext';
import { useToast } from '../../../hooks/use-toast';

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '',
  categoryId: '', tags: [], authorId: '', readingTime: '',
  featuredImage: '', gallery: [],
  status: 'draft', featured: false, trending: false, editorsPick: false,
  seoTitle: '', metaDescription: '', focusKeyword: '',
  canonicalUrl: '', robotsIndex: true, robotsFollow: true,
  ogTitle: '', ogDescription: '', ogImage: '',
  twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '',
  publishedAt: null,
};

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const toLocalInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
    {title && <h3 className="font-semibold text-sm">{title}</h3>}
    {children}
  </div>
);

const BlogPostForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin } = useAdminAuth();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedSlug, setSavedSlug] = useState(null);

  useEffect(() => {
    getBlogCategories().then(setCategories);
    getBlogTags().then(setTags);
    getBlogAuthors().then(setAuthors);
  }, []);

  useEffect(() => {
    if (!isEdit) {
      getBlogSettings().then((s) => setForm((f) => ({ ...f, authorId: s.defaultAuthorId || f.authorId })));
      return;
    }
    getBlogPost(id).then((p) => {
      if (p) {
        setForm({ ...EMPTY, ...p, tags: p.tags || [], gallery: p.gallery || [] });
        setSavedSlug(p.slug);
      }
      setLoading(false);
    });
    getBlogRevisionsForPost(id).then(setRevisions);
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const toggleTag = (tagId) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tagId) ? f.tags.filter((t) => t !== tagId) : [...f.tags, tagId],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.categoryId) errs.categoryId = 'Select a category';
    if (!form.featuredImage) errs.featuredImage = 'Add a featured image';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = (overrides = {}) => ({
    ...form,
    slug: form.slug || slugify(form.title),
    readingTime: form.readingTime || '3 min read',
    modifiedBy: admin?.name || 'Admin',
    ...overrides,
  });

  const persist = async (payload, successMsg, { stay } = {}) => {
    setSaving(true);
    try {
      let saved;
      if (isEdit) saved = await updateBlogPost(id, payload);
      else saved = await createBlogPost(payload);
      toast({ title: successMsg, description: payload.title });
      if (stay) {
        setForm((f) => ({ ...f, ...saved }));
        setSavedSlug(saved.slug);
        if (!isEdit) navigate(`/admin/blog/edit/${saved.id}`, { replace: true });
        else getBlogRevisionsForPost(id).then(setRevisions);
      } else {
        navigate('/admin/blog');
      }
    } catch (err) {
      toast({ title: 'Something went wrong', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    await persist(buildPayload({ status: 'draft' }), 'Draft saved', { stay: true });
  };

  const isScheduling = form.status === 'scheduled' && form.publishedAt && new Date(form.publishedAt) > new Date();

  const handlePublish = async () => {
    if (!validate()) return;
    if (isScheduling) {
      await persist(buildPayload({ status: 'scheduled' }), 'Post scheduled', { stay: true });
    } else {
      await persist(buildPayload({ status: 'published', publishedAt: form.publishedAt || new Date().toISOString() }), 'Post published', { stay: true });
    }
  };

  const handlePreview = () => {
    const slug = form.slug || savedSlug || slugify(form.title);
    if (!slug) { toast({ title: 'Add a title first', variant: 'destructive' }); return; }
    window.open(`/blog/${slug}?preview=1`, '_blank', 'noopener');
  };

  const categoryLabel = categories.find((c) => c.id === form.categoryId)?.name || '';
  const authorName = authors.find((a) => a.id === form.authorId)?.name || '';

  const schemaPreview = useMemo(
    () => JSON.stringify(buildBlogPostingSchema(form, { authorName, categoryLabel }), null, 2),
    [form, authorName, categoryLabel]
  );

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Post' : 'Add New Post'}
        backTo="/admin/blog"
        backLabel="All Posts"
        actions={
          <>
            <button type="button" onClick={handlePreview} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button type="button" onClick={handleSaveDraft} disabled={saving} className="px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" onClick={handlePublish} disabled={saving} className="px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
              {saving ? 'Saving…' : isScheduling ? 'Schedule' : 'Publish'}
            </button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard>
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input value={form.title} onChange={set('title')} className={inputClass} placeholder="e.g. Choosing the Right License for Your Project" />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Slug</label>
              <input value={form.slug} onChange={set('slug')} className={inputClass} placeholder="auto-generated from title if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Short Description</label>
              <textarea value={form.excerpt} onChange={set('excerpt')} className={textareaClass} placeholder="A one or two sentence summary shown on cards and previews…" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Content</label>
              <RichTextEditorPlaceholder value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} />
            </div>
          </SectionCard>

          <SectionCard title="Media">
            <div>
              <label className="block text-sm font-medium mb-1.5">Featured Image</label>
              <MediaPickerField value={form.featuredImage} onChange={(v) => setForm((f) => ({ ...f, featuredImage: v }))} modalTitle="Select Featured Image" />
              {errors.featuredImage && <p className="text-xs text-red-600 mt-1">{errors.featuredImage}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Gallery</label>
              <MediaPickerField value={form.gallery} onChange={(v) => setForm((f) => ({ ...f, gallery: v }))} multiple modalTitle="Select Gallery Images" />
            </div>
          </SectionCard>

          <SectionCard title="SEO — Basics">
            <div>
              <label className="block text-sm font-medium mb-1.5">SEO Title</label>
              <input value={form.seoTitle} onChange={set('seoTitle')} className={inputClass} placeholder="Defaults to the post title if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Meta Description</label>
              <textarea value={form.metaDescription} onChange={set('metaDescription')} className={textareaClass} placeholder="Defaults to the short description if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Focus Keyword</label>
              <input value={form.focusKeyword} onChange={set('focusKeyword')} className={inputClass} placeholder="e.g. digital product license" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Canonical URL</label>
              <input value={form.canonicalUrl} onChange={set('canonicalUrl')} className={inputClass} placeholder="Defaults to this post's own URL if left blank" />
            </div>
            <ToggleRow label="Allow search engines to index this page" checked={form.robotsIndex} onChange={(v) => setForm((f) => ({ ...f, robotsIndex: v }))} />
            <ToggleRow label="Allow search engines to follow links on this page" checked={form.robotsFollow} onChange={(v) => setForm((f) => ({ ...f, robotsFollow: v }))} />
          </SectionCard>

          <SectionCard title="SEO — Open Graph">
            <div>
              <label className="block text-sm font-medium mb-1.5">OG Title</label>
              <input value={form.ogTitle} onChange={set('ogTitle')} className={inputClass} placeholder="Defaults to SEO Title if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">OG Description</label>
              <textarea value={form.ogDescription} onChange={set('ogDescription')} className={textareaClass} placeholder="Defaults to Meta Description if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">OG Image</label>
              <MediaPickerField value={form.ogImage} onChange={(v) => setForm((f) => ({ ...f, ogImage: v }))} modalTitle="Select OG Image" />
            </div>
          </SectionCard>

          <SectionCard title="SEO — Twitter Card">
            <div>
              <label className="block text-sm font-medium mb-1.5">Card Type</label>
              <Select value={form.twitterCard} onValueChange={set('twitterCard')}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Twitter Title</label>
              <input value={form.twitterTitle} onChange={set('twitterTitle')} className={inputClass} placeholder="Defaults to OG Title if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Twitter Description</label>
              <textarea value={form.twitterDescription} onChange={set('twitterDescription')} className={textareaClass} placeholder="Defaults to OG Description if left blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Twitter Image</label>
              <MediaPickerField value={form.twitterImage} onChange={(v) => setForm((f) => ({ ...f, twitterImage: v }))} modalTitle="Select Twitter Image" />
            </div>
          </SectionCard>

          <SectionCard title="SEO — Schema Preview">
            <p className="text-xs text-muted-foreground -mt-1">Read-only preview of the structured data this post will output. Regenerates automatically as you edit.</p>
            <pre className="text-[11px] leading-relaxed bg-secondary/40 rounded-xl p-4 overflow-x-auto">{schemaPreview}</pre>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Organize">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <Select value={form.categoryId} onValueChange={set('categoryId')}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tags</label>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-xl border border-border p-3">
                {tags.length === 0 && <p className="text-xs text-muted-foreground">No tags yet.</p>}
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.tags.includes(t.id)} onCheckedChange={() => toggleTag(t.id)} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Author</label>
              <Select value={form.authorId} onValueChange={set('authorId')}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select author" /></SelectTrigger>
                <SelectContent>
                  {authors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Manage authors under Blog &gt; Authors.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reading Time</label>
              <input value={form.readingTime} onChange={set('readingTime')} className={inputClass} placeholder="e.g. 5 min read" />
            </div>
          </SectionCard>

          <SectionCard title="Status">
            <div>
              <Select value={form.status} onValueChange={set('status')}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Publish Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(form.publishedAt)}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1">Use the Publish button to save the schedule.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard>
            <h3 className="font-semibold text-sm -mb-1">Visibility</h3>
            <ToggleRow label="Featured" description="Show in the Blog page hero." checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} />
            <ToggleRow label="Trending" description="Flag as a trending read." checked={form.trending} onChange={(v) => setForm((f) => ({ ...f, trending: v }))} />
            <ToggleRow label="Editor's Pick" description="Highlight as an editor's pick." checked={form.editorsPick} onChange={(v) => setForm((f) => ({ ...f, editorsPick: v }))} />
          </SectionCard>

          {isEdit && (
            <SectionCard>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Revisions</h3>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Version:</span> {form.version || 1}</p>
                <p><span className="text-muted-foreground">Last Modified:</span> {formatDateTime(form.updatedAt)}</p>
                <p><span className="text-muted-foreground">Modified By:</span> {form.modifiedBy || 'Admin'}</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Version History</p>
                {revisions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No history recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {revisions.slice().reverse().map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-xs bg-secondary/40 rounded-lg px-3 py-2">
                        <div>
                          <p className="font-medium">v{r.version} — {r.summary}</p>
                          <p className="text-muted-foreground mt-0.5">{r.modifiedBy} · {formatDateTime(r.createdAt)}</p>
                        </div>
                        <button type="button" disabled title="Available once the backend is connected" className="text-muted-foreground/60 cursor-not-allowed font-medium">
                          Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostForm;
