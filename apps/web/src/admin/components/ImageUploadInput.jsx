import React, { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadProductImage, validateImageFile, MAX_IMAGE_UPLOAD_MB } from '../../lib/imageUpload';

/**
 * Controlled multi/single image field. `value` is a string (single mode)
 * or string[] (multiple mode); `onChange` receives the same shape back.
 * Files are validated (JPG/PNG/WEBP ≤ 25 MB) and uploaded via multipart.
 */
const ImageUploadInput = ({ value, onChange, multiple = false, label }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const images = multiple ? (value || []) : (value ? [value] : []);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        validateImageFile(file);
        const uploaded = await uploadProductImage(file);
        urls.push(uploaded.url);
      }
      if (multiple) onChange([...(value || []), ...urls]);
      else onChange(urls[0]);
    } catch (err) {
      setError(err?.message || `Upload failed. Use JPG/PNG/WEBP up to ${MAX_IMAGE_UPLOAD_MB} MB.`);
    } finally {
      setUploading(false);
    }
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
          <div key={`${String(src).slice(0, 40)}-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
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
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-border grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        JPG, PNG, or WEBP · max {MAX_IMAGE_UPLOAD_MB} MB
      </p>
      {error ? <p className="mt-1 text-xs font-medium text-destructive">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
};

export default ImageUploadInput;
