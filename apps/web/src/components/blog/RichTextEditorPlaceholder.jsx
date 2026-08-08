import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Bold, Italic, Underline, Link as LinkIcon, List, ListOrdered, Quote, Heading2, Image as ImageIcon } from 'lucide-react';
import MediaLibraryModal from '../media/MediaLibraryModal';

/**
 * Replaces the old placeholder with a working rich text editor using Quill
 * (via react-quill). Keeps the same value/onChange contract (HTML string).
 *
 * The toolbar uses Quill's toolbar bindings so active state is shown
 * automatically. Link and Image handlers are customized to validate URLs
 * and reuse the shared Media Library for uploads/selection.
 */
const RichTextEditorPlaceholder = ({ value, onChange, placeholder }) => {
  const quillRef = useRef(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  // Toolbar configuration — use a named container so we can keep markup
  const modules = {
    toolbar: {
      container: '#apnastore-editor-toolbar',
      handlers: {
        image: () => setMediaOpen(true),
        link: function (value) {
          // Custom link handler: prompt for URL, validate, then format
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection?.();
          const current = range ? quill.getText(range.index, range.length) : '';
          let url = window.prompt('Enter a URL', 'https://');
          if (!url) return;
          url = url.trim();
          try {
            // allow mailto:
            if (url.startsWith('mailto:')) {
              quill.format('link', url);
              return;
            }
            const parsed = new URL(url);
            const ok = ['http:', 'https:'].includes(parsed.protocol);
            if (!ok) throw new Error('Invalid protocol');
            quill.format('link', parsed.toString());
          } catch (e) {
            window.alert('Invalid URL — only http://, https:// and mailto: are allowed');
          }
        },
      },
    },
  };

  const formats = ['bold', 'italic', 'underline', 'header', 'blockquote', 'list', 'bullet', 'link', 'image'];

  const handleMediaSelect = (urls) => {
    setMediaOpen(false);
    if (!urls || urls.length === 0) return;
    const url = urls[0];
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
    quill.insertEmbed(range.index, 'image', url);
    // move cursor after image
    quill.setSelection(range.index + 1, 0);
    // trigger change by reading editor HTML
    onChange(quill.root.innerHTML);
  };

  const handleChange = (content, delta, source, editor) => {
    onChange(content);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div id="apnastore-editor-toolbar" className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-border bg-secondary/40">
        <button className="ql-bold p-2 rounded-lg" aria-label="Bold"><Bold className="w-3.5 h-3.5" /></button>
        <button className="ql-italic p-2 rounded-lg" aria-label="Italic"><Italic className="w-3.5 h-3.5" /></button>
        <button className="ql-underline p-2 rounded-lg" aria-label="Underline"><Underline className="w-3.5 h-3.5" /></button>
        <button className="ql-header" value="2" aria-label="H2" style={{ padding: 8, borderRadius: 8 }}>H2</button>
        <button className="ql-header" value="3" aria-label="H3" style={{ padding: 8, borderRadius: 8 }}>H3</button>
        <button className="ql-blockquote p-2 rounded-lg" aria-label="Blockquote"><Quote className="w-3.5 h-3.5" /></button>
        <button className="ql-list" value="bullet" className="ql-list p-2 rounded-lg" aria-label="Bullet list"><List className="w-3.5 h-3.5" /></button>
        <button className="ql-list" value="ordered" className="ql-list p-2 rounded-lg" aria-label="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></button>
        <button className="ql-link p-2 rounded-lg" aria-label="Link"><LinkIcon className="w-3.5 h-3.5" /></button>
        <button className="ql-image p-2 rounded-lg" aria-label="Image"><ImageIcon className="w-3.5 h-3.5" /></button>
      </div>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write your post content…'}
        className="bg-white"
      />

      <p className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border bg-secondary/20">
        Use the toolbar to format content. Images are uploaded/selected via the Media Library.
      </p>

      <MediaLibraryModal
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        multiple={false}
        onSelect={handleMediaSelect}
        title="Insert Image"
      />
    </div>
  );
};

export default RichTextEditorPlaceholder;
