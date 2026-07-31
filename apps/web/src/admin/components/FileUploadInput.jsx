import React, { useRef } from 'react';
import { Upload, X, FileArchive, FileVideo } from 'lucide-react';

const fmtSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};

/**
 * Controlled non-image file field for product downloadables (ZIP source
 * files, preview videos). Mirrors ImageUploadInput's shape/behavior but
 * only tracks { name, size } metadata — actual binary upload swaps in
 * later against a real storage endpoint with no prop changes.
 *
 * `value` is a single { name, size } object (multiple=false) or an
 * array of them (multiple=true). `accept` is a native input accept
 * string, e.g. "application/zip" or "video/*".
 */
const FileUploadInput = ({ value, onChange, multiple = false, accept, label, icon: Icon = FileArchive, hint }) => {
  const inputRef = useRef(null);
  const items = multiple ? (value || []) : (value ? [value] : []);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const entries = files.map((f) => ({ name: f.name, size: f.size }));
    if (multiple) onChange([...(value || []), ...entries]);
    else onChange(entries[0]);
  };

  const removeAt = (idx) => {
    if (multiple) onChange((value || []).filter((_, i) => i !== idx));
    else onChange(null);
  };

  return (
    <div>
      {label && <p className="text-sm font-medium mb-2">{label}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.name + i} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.size != null && <p className="text-xs text-muted-foreground">{fmtSize(item.size)}</p>}
            </div>
            <button type="button" onClick={() => removeAt(i)} aria-label="Remove file" className="p-1 rounded-full hover:bg-secondary transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {(multiple || items.length === 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload {multiple ? 'files' : 'file'}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
};

export { FileVideo, FileArchive };
export default FileUploadInput;
