import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Controlled multi/single image field. `value` is a string (single mode)
 * or string[] (multiple mode); `onChange` receives the same shape back.
 * Internals read files as data URLs for the mock/local phase — swapping
 * to a real upload endpoint later means replacing readAsDataUrl() with a
 * POST to /api/media and using the returned URL, with no prop changes.
 */
const ImageUploadInput = ({ value, onChange, multiple = false, label }) => {
  const inputRef = useRef(null);
  const images = multiple ? (value || []) : (value ? [value] : []);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const urls = await Promise.all(files.map(readAsDataUrl));
    if (multiple) onChange([...(value || []), ...urls]);
    else onChange(urls[0]);
  };

  const removeAt = (idx) => {
    if (multiple) onChange((value || []).filter((_, i) => i !== idx));
    else onChange('');
  };

  return (
    <div>
      {label && <p className="text-sm font-medium mb-2">{label}</p>}
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={src.slice(0, 40) + i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove image"
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {(multiple || images.length === 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-border grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="w-5 h-5" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
};

export default ImageUploadInput;
