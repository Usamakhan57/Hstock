import React, { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';

/**
 * Same value/onChange contract as ImageUploadInput (`value` is a string
 * in single mode or string[] in multiple mode) but the "add image"
 * action opens the shared Media Library modal instead of a bare file
 * input — every image field in the Blog CMS uses this component so
 * uploads, search, and reuse-existing-image all go through one place.
 */
const MediaPickerField = ({ value, onChange, multiple = false, label, modalTitle }) => {
  const [open, setOpen] = useState(false);
  const images = multiple ? (value || []) : (value ? [value] : []);

  const handleSelect = (urls) => {
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
            onClick={() => setOpen(true)}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-border grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
        )}
      </div>

      <MediaLibraryModal
        open={open}
        onOpenChange={setOpen}
        multiple={multiple}
        onSelect={handleSelect}
        title={modalTitle || 'Select Image'}
      />
    </div>
  );
};

export default MediaPickerField;
