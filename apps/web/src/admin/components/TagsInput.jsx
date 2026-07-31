import React, { useState } from 'react';
import { X } from 'lucide-react';
import { inputClass } from './FormSheet';

/**
 * Controlled chip-style tag editor. `value` is a string[]; `onChange`
 * receives the updated array. Enter or comma commits the current draft
 * as a new tag.
 */
const TagsInput = ({ value = [], onChange, placeholder }) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const tag = draft.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const removeAt = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <div className={`${inputClass} flex flex-wrap items-center gap-1.5 min-h-[44px] py-2`}>
        {value.map((tag, i) => (
          <span key={tag + i} className="inline-flex items-center gap-1 bg-secondary rounded-full pl-2.5 pr-1.5 py-1 text-xs font-medium">
            {tag}
            <button type="button" onClick={() => removeAt(i)} aria-label={`Remove tag ${tag}`} className="p-0.5 rounded-full hover:bg-border">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length ? '' : (placeholder || 'Type and press Enter…')}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
        />
      </div>
    </div>
  );
};

export default TagsInput;
