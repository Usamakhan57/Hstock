import React from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { inputClass, textareaClass } from '../FormSheet';

export const DEFAULT_LICENSES = [
  { id: 'personal', name: 'Personal License', enabled: true, price: '', description: 'For personal, non-commercial use only.', commercialRights: false, editableName: false },
  { id: 'commercial', name: 'Commercial License', enabled: false, price: '', description: 'Allows use in client and commercial projects.', commercialRights: true, editableName: false },
  { id: 'extended', name: 'Extended License', enabled: false, price: '', description: 'Removes resale/print-run caps for high-volume use.', commercialRights: true, editableName: false },
  { id: 'custom', name: 'Custom License', enabled: false, price: '', description: '', commercialRights: false, editableName: true },
];

/**
 * Per-license pricing/rights editor. `value` is an array shaped like
 * DEFAULT_LICENSES; `onChange` receives the updated array. Each license
 * can be toggled on/off, priced independently, and (for Custom) renamed.
 */
const LicensingEditor = ({ value = DEFAULT_LICENSES, onChange }) => {
  const updateAt = (id, patch) => onChange(value.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-3">
      {value.map((license) => (
        <div key={license.id} className={`rounded-xl border p-4 space-y-3 transition-colors ${license.enabled ? 'border-primary/40 bg-primary/[0.03]' : 'border-border'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
              <Checkbox checked={license.enabled} onCheckedChange={(v) => updateAt(license.id, { enabled: !!v })} />
              {license.editableName ? (
                <input
                  value={license.name}
                  onChange={(e) => updateAt(license.id, { name: e.target.value })}
                  className="text-sm font-semibold bg-transparent outline-none border-b border-dashed border-border focus:border-primary min-w-0"
                  placeholder="Custom license name"
                />
              ) : (
                <span className="text-sm font-semibold truncate">{license.name}</span>
              )}
            </label>
            {license.enabled && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={license.price}
                  onChange={(e) => updateAt(license.id, { price: e.target.value })}
                  className={`${inputClass} w-24 py-1.5`}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
          {license.enabled && (
            <>
              <textarea
                value={license.description}
                onChange={(e) => updateAt(license.id, { description: e.target.value })}
                className={`${textareaClass} min-h-[60px]`}
                placeholder="What this license permits…"
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox checked={license.commercialRights} onCheckedChange={(v) => updateAt(license.id, { commercialRights: !!v })} />
                Includes commercial rights
              </label>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default LicensingEditor;
