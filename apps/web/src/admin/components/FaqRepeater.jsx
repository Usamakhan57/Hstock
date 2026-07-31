import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { inputClass, textareaClass } from './FormSheet';

/**
 * Repeatable Question/Answer editor for a product's FAQ list.
 * `value` is an array of { question, answer } objects; `onChange`
 * receives the updated array. Supports unlimited add, per-row edit,
 * delete, and reordering via up/down controls (no drag-and-drop
 * dependency needed for a simple linear list).
 */
const FaqRepeater = ({ value = [], onChange }) => {
  const updateAt = (idx, key, val) => {
    onChange(value.map((item, i) => (i === idx ? { ...item, [key]: val } : item)));
  };

  const addItem = () => onChange([...value, { question: '', answer: '' }]);

  const removeAt = (idx) => onChange(value.filter((_, i) => i !== idx));

  const moveItem = (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">No FAQs yet — add one below.</p>
      )}

      {value.map((item, idx) => (
        <div key={idx} className="rounded-xl border border-border p-3.5 space-y-2.5 bg-secondary/20">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">FAQ {idx + 1}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItem(idx, -1)}
                disabled={idx === 0}
                aria-label="Move FAQ up"
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(idx, 1)}
                disabled={idx === value.length - 1}
                aria-label="Move FAQ down"
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label="Delete FAQ"
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <input
            value={item.question}
            onChange={(e) => updateAt(idx, 'question', e.target.value)}
            className={inputClass}
            placeholder="Question"
          />
          <textarea
            value={item.answer}
            onChange={(e) => updateAt(idx, 'answer', e.target.value)}
            className={`${textareaClass} min-h-[70px]`}
            placeholder="Answer"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add FAQ
      </button>
    </div>
  );
};

export default FaqRepeater;
