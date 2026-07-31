import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Checkbox } from '../../../components/ui/checkbox';
import { inputClass } from '../FormSheet';

export const ATTRIBUTE_PRESETS = ['Size', 'Color', 'License', 'Material', 'Format', 'Resolution', 'Orientation', 'Software Compatibility'];

/**
 * `value` is { allowVariations: bool, attributes: [{ id, name, values: string[] }] }.
 * onChange receives the updated object. Quick-add chips seed a preset
 * attribute name; each attribute then gets its own comma/Enter-committed
 * value list, mirroring TagsInput's interaction model.
 */
const VariationsEditor = ({ value, onChange }) => {
  const { allowVariations = false, attributes = [] } = value || {};
  const [drafts, setDrafts] = useState({});

  const set = (patch) => onChange({ allowVariations, attributes, ...value, ...patch });

  const addAttribute = (name) => {
    if (attributes.some((a) => a.name.toLowerCase() === name.toLowerCase())) return;
    set({ attributes: [...attributes, { id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, values: [] }] });
  };

  const removeAttribute = (id) => set({ attributes: attributes.filter((a) => a.id !== id) });

  const addValue = (id) => {
    const draft = (drafts[id] || '').trim();
    if (!draft) return;
    set({ attributes: attributes.map((a) => (a.id === id ? { ...a, values: [...a.values, draft] } : a)) });
    setDrafts((d) => ({ ...d, [id]: '' }));
  };

  const removeValue = (id, idx) => {
    set({ attributes: attributes.map((a) => (a.id === id ? { ...a, values: a.values.filter((_, i) => i !== idx) } : a)) });
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2.5 cursor-pointer">
        <Checkbox checked={allowVariations} onCheckedChange={(v) => set({ allowVariations: !!v })} />
        <span className="text-sm font-semibold">Allow Variations</span>
      </label>

      {allowVariations && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {ATTRIBUTE_PRESETS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addAttribute(name)}
                disabled={attributes.some((a) => a.name.toLowerCase() === name.toLowerCase())}
                className="px-3 py-1.5 rounded-full border border-dashed border-border text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3 inline -mt-0.5 mr-1" />{name}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {attributes.map((attr) => (
              <div key={attr.id} className="rounded-xl border border-border p-3.5 space-y-2.5 bg-secondary/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{attr.name}</span>
                  <button type="button" onClick={() => removeAttribute(attr.id)} aria-label={`Remove ${attr.name}`} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className={`${inputClass} flex flex-wrap items-center gap-1.5 min-h-[44px] py-2`}>
                  {attr.values.map((v, i) => (
                    <span key={v + i} className="inline-flex items-center gap-1 bg-secondary rounded-full pl-2.5 pr-1.5 py-1 text-xs font-medium">
                      {v}
                      <button type="button" onClick={() => removeValue(attr.id, i)} aria-label={`Remove ${v}`} className="p-0.5 rounded-full hover:bg-border">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={drafts[attr.id] || ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [attr.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addValue(attr.id); } }}
                    onBlur={() => addValue(attr.id)}
                    placeholder={attr.values.length ? '' : 'Type a value and press Enter…'}
                    className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
                  />
                </div>
              </div>
            ))}
            {attributes.length === 0 && <p className="text-xs text-muted-foreground">Pick an attribute above to start adding variations.</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default VariationsEditor;
