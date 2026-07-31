import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { Switch } from '../../../components/ui/switch';
import { getHomepageCms, updateHomepageCms } from '../../api/homepageCms';
import { useToast } from '../../../hooks/use-toast';

const byOrder = (a, b) => a.sortOrder - b.sortOrder;

const SectionCard = ({ section, isFirst, isLast, isOpen, onToggleOpen, onToggleEnabled, onMove, onChange }) => {
  const set = (key) => (e) => onChange({ ...section, [key]: e?.target ? e.target.value : e });

  return (
    <div className={`bg-white rounded-2xl border transition-colors ${section.enabled ? 'border-border' : 'border-border/60 opacity-70'}`}>
      <div className="flex items-center gap-3 p-4">
        <div className="flex flex-col shrink-0">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={isFirst}
            aria-label="Move section up"
            className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={isLast}
            aria-label="Move section down"
            className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span className="w-9 h-9 rounded-xl bg-secondary grid place-items-center shrink-0">
            {section.enabled ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
          </span>
          <span className="min-w-0">
            <p className="font-semibold text-sm truncate">{section.label}</p>
            <p className="text-xs text-muted-foreground truncate">{section.title || 'No title set'}</p>
          </span>
        </button>

        <Switch checked={section.enabled} onCheckedChange={(v) => onToggleEnabled(v)} aria-label={`Toggle ${section.label}`} />

        <button type="button" onClick={onToggleOpen} aria-label={isOpen ? 'Collapse' : 'Expand'} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t border-border">
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Section Title</label>
              <input value={section.title} onChange={set('title')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Subtitle</label>
              <input value={section.subtitle} onChange={set('subtitle')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={section.description} onChange={set('description')} className={textareaClass} placeholder="Optional supporting copy shown under the subtitle." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Items to Show</label>
              <input
                type="number"
                min="0"
                value={section.maxProducts ?? ''}
                onChange={(e) => onChange({ ...section, maxProducts: e.target.value === '' ? null : Number(e.target.value) })}
                className={inputClass}
                placeholder="No limit"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank for no limit. Not used by every section type.</p>
            </div>
            <ImageUploadInput label="Background Image" value={section.backgroundImage} onChange={(v) => onChange({ ...section, backgroundImage: v })} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Button Text</label>
              <input value={section.buttonText} onChange={set('buttonText')} className={inputClass} placeholder="e.g. Shop Now" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Button URL</label>
              <input value={section.buttonUrl} onChange={set('buttonUrl')} className={inputClass} placeholder="/shop" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HomepageCms = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState(null);
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getHomepageCms().then((data) => setSections([...(data.sections || [])].sort(byOrder)));
  }, []);

  const toggleOpen = (key) => setOpenKeys((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const updateSection = (key, patch) => setSections((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const moveSection = (index, direction) => setSections((list) => {
    const next = [...list];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= next.length) return list;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    return next.map((s, i) => ({ ...s, sortOrder: i + 1 }));
  });

  const handleSave = async () => {
    setSaving(true);
    await updateHomepageCms({ sections });
    toast({ title: 'Homepage saved', description: 'Changes will apply next time the storefront loads.' });
    setSaving(false);
  };

  if (!sections) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Homepage"
        description="Control which sections appear on the storefront home page, their order, and their content."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <LayoutTemplate className="w-3.5 h-3.5" />
        Reorder sections with the arrows, toggle visibility, and expand a section to edit its content.
      </div>

      <div className="space-y-3 max-w-3xl">
        {sections.map((section, index) => (
          <SectionCard
            key={section.key}
            section={section}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            isOpen={openKeys.has(section.key)}
            onToggleOpen={() => toggleOpen(section.key)}
            onToggleEnabled={(v) => updateSection(section.key, { enabled: v })}
            onMove={(dir) => moveSection(index, dir)}
            onChange={(next) => updateSection(section.key, next)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomepageCms;
