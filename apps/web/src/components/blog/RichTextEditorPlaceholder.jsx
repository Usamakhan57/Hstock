import React from 'react';
import { Bold, Italic, Underline, Link as LinkIcon, List, ListOrdered, Quote, Heading2, Image as ImageIcon } from 'lucide-react';

/**
 * Visual stand-in for a real rich text editor (TipTap / Lexical / etc).
 * Renders a WYSIWYG-looking toolbar over a plain textarea so the Add/Edit
 * Post layout, spacing, and content field are final now. The only change
 * needed later is swapping this component's internals for the real
 * editor library — `value`/`onChange` (plain string in, plain string
 * out) stays the same, so BlogPostForm never has to change.
 */
const RichTextEditorPlaceholder = ({ value, onChange, placeholder }) => (
  <div className="rounded-xl border border-border overflow-hidden">
    <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-border bg-secondary/40">
      {[Bold, Italic, Underline, Heading2, Quote, List, ListOrdered, LinkIcon, ImageIcon].map((Icon, i) => (
        <button
          key={i}
          type="button"
          disabled
          title="Connect a rich text editor library to enable formatting"
          className="p-2 rounded-lg text-muted-foreground/70 cursor-not-allowed"
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Write your post content…'}
      className="w-full min-h-[280px] p-4 text-sm outline-none resize-y bg-white"
    />
    <p className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border bg-secondary/20">
      Plain-text editor for now — a full rich text editor (TipTap/Lexical) drops in here once the backend is connected.
    </p>
  </div>
);

export default RichTextEditorPlaceholder;
