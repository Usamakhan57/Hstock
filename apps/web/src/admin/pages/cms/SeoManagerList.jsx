import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getSeoEntries, updateSeoEntry } from '../../api/seoEntries';
import { useToast } from '../../../hooks/use-toast';

const SeoCard = ({ entry, isOpen, onToggleOpen, onChange }) => {
  const set = (key) => (e) => onChange({ ...entry, [key]: e?.target ? e.target.value : e });

  return (
    <div className="bg-white rounded-2xl border border-border">
      <button type="button" onClick={onToggleOpen} className="flex items-center gap-3 w-full p-4 text-left">
        <span className="w-9 h-9 rounded-xl bg-secondary grid place-items-center shrink-0">
          <Search className="w-4 h-4 text-primary" />
        </span>
        <span className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{entry.pageType}</p>
          <p className="text-xs text-muted-foreground truncate">{entry.metaTitle || 'No meta title set'}</p>
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t border-border">
          <div className="pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Basics</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Title</label>
                <input value={entry.metaTitle} onChange={set('metaTitle')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Description</label>
                <textarea value={entry.metaDescription} onChange={set('metaDescription')} className={textareaClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Keywords</label>
                <input value={entry.keywords} onChange={set('keywords')} className={inputClass} placeholder="Comma separated" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Canonical URL</label>
                <input value={entry.canonicalUrl} onChange={set('canonicalUrl')} className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Open Graph</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">OG Title</label>
                <input value={entry.ogTitle} onChange={set('ogTitle')} className={inputClass} placeholder="Defaults to Meta Title if left blank" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">OG Description</label>
                <textarea value={entry.ogDescription} onChange={set('ogDescription')} className={textareaClass} placeholder="Defaults to Meta Description if left blank" />
              </div>
              <ImageUploadInput label="OG Image" value={entry.ogImage} onChange={(v) => onChange({ ...entry, ogImage: v })} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Twitter Card</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Card Type</label>
                <Select value={entry.twitterCard} onValueChange={(v) => onChange({ ...entry, twitterCard: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Twitter Title</label>
                <input value={entry.twitterTitle} onChange={set('twitterTitle')} className={inputClass} placeholder="Defaults to OG Title if left blank" />
              </div>
              <ImageUploadInput label="Twitter Image" value={entry.twitterImage} onChange={(v) => onChange({ ...entry, twitterImage: v })} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Schema</h4>
            <div>
              <label className="block text-sm font-medium mb-1.5">Schema Type (Placeholder)</label>
              <input value={entry.schemaType} onChange={set('schemaType')} className={inputClass} placeholder="e.g. WebSite, WebPage" />
              <p className="text-xs text-muted-foreground mt-1">Structured data (JSON-LD) generates from this once the backend is connected.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SeoManagerList = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState(null);
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSeoEntries().then(setEntries); }, []);

  const toggleOpen = (id) => setOpenKeys((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const updateLocal = (id, patch) => setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const handleSave = async () => {
    setSaving(true);
    await Promise.all(entries.map((e) => updateSeoEntry(e.id, e)));
    toast({ title: 'SEO settings saved' });
    setSaving(false);
  };

  if (!entries) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="SEO Manager"
        description="Meta tags, Open Graph, and Twitter Card defaults per page type. Blog and Static Pages manage their own SEO on their respective edit screens."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-3 max-w-3xl">
        {entries.map((entry) => (
          <SeoCard
            key={entry.id}
            entry={entry}
            isOpen={openKeys.has(entry.id)}
            onToggleOpen={() => toggleOpen(entry.id)}
            onChange={(next) => updateLocal(entry.id, next)}
          />
        ))}
      </div>
    </div>
  );
};

export default SeoManagerList;
