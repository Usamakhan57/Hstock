import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { inputClass } from '../../components/FormSheet';
import { Switch } from '../../../components/ui/switch';
import { getPopularTags, updatePopularTags, DEFAULT_POPULAR_TAGS } from '../../api/popularTags';
import { useToast } from '../../../hooks/use-toast';

const byOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

const PopularTagsCms = () => {
  const { toast } = useToast();
  const [tags, setTags] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPopularTags().then((data) => {
      const list = Array.isArray(data?.tags) && data.tags.length
        ? [...data.tags].sort(byOrder)
        : [...DEFAULT_POPULAR_TAGS.tags];
      setTags(list);
    });
  }, []);

  const updateTag = (id, patch) => setTags((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const moveTag = (index, direction) => setTags((list) => {
    const next = [...list];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= next.length) return list;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    return next.map((t, i) => ({ ...t, sortOrder: i + 1 }));
  });

  const removeTag = (id) => setTags((list) => list.filter((t) => t.id !== id).map((t, i) => ({ ...t, sortOrder: i + 1 })));

  const addTag = () => setTags((list) => ([
    ...list,
    {
      id: `pt-${Date.now()}`,
      label: 'New tag',
      url: '/shop',
      enabled: true,
      sortOrder: list.length + 1,
    },
  ]));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePopularTags({ tags: tags.map((t, i) => ({ ...t, sortOrder: i + 1 })) });
      toast({ title: 'Popular tags saved', description: 'Homepage Popular section updates immediately.' });
    } catch (err) {
      toast({ title: 'Could not save popular tags', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!tags) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Popular Tags"
        description="Control the homepage Popular pills — add, remove, reorder, edit labels/URLs, and enable/disable. Changes sync to the storefront immediately."
        actions={(
          <button type="button" onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      />

      <div className="space-y-3 max-w-3xl">
        {tags.map((tag, index) => (
          <div key={tag.id} className={`bg-white rounded-2xl border border-border p-4 ${tag.enabled ? '' : 'opacity-70'}`}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex flex-col shrink-0">
                <button type="button" onClick={() => moveTag(index, 'up')} disabled={index === 0} aria-label="Move up" className="p-0.5 rounded hover:bg-secondary disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveTag(index, 'down')} disabled={index === tags.length - 1} aria-label="Move down" className="p-0.5 rounded hover:bg-secondary disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Label</label>
                  <input value={tag.label} onChange={(e) => updateTag(tag.id, { label: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Destination URL</label>
                  <input value={tag.url} onChange={(e) => updateTag(tag.id, { url: e.target.value })} className={inputClass} placeholder="/shop?search=Gmail" />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-5">
                <Switch checked={tag.enabled} onCheckedChange={(v) => updateTag(tag.id, { enabled: v })} aria-label={`Enable ${tag.label}`} />
                <button type="button" onClick={() => removeTag(tag.id)} aria-label="Remove tag" className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addTag} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add tag
        </button>
      </div>
    </div>
  );
};

export default PopularTagsCms;
