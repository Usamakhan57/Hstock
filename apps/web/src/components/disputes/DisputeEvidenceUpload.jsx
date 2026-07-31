import React, { useRef, useState } from 'react';
import { FileImage, Loader2, Trash2, Upload, ExternalLink, AlertTriangle } from 'lucide-react';
import { uploadEvidenceFiles, isUsableEvidenceUrl } from '../../lib/evidenceUpload';

/**
 * Multi-file evidence picker with progress, preview, remove, and optional URL add.
 * Does not redesign surrounding layouts — self-contained panel.
 */
const DisputeEvidenceUpload = ({
  files = [],
  onChange,
  disabled = false,
  maxFiles = 20,
}) => {
  const inputRef = useRef(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState('');

  const update = (next) => onChange?.(next);

  const handleFiles = async (fileList) => {
    if (disabled || !fileList?.length) return;
    setError('');
    const remaining = maxFiles - files.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${maxFiles} files.`);
      return;
    }
    const slice = Array.from(fileList).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded = await uploadEvidenceFiles(slice, {
        onItemProgress: (index, pct, file) => {
          setProgress((prev) => ({ ...prev, [file.name]: pct }));
        },
      });
      const ok = uploaded.filter((item) => item.url);
      const failed = uploaded.filter((item) => item.error);
      if (failed.length) {
        setError(failed.map((f) => `${f.name}: ${f.error}`).join(' · '));
      }
      update([...files, ...ok]);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress({});
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    if (!isUsableEvidenceUrl(url)) {
      setError('Enter a valid http(s) image or file URL.');
      return;
    }
    if (files.length >= maxFiles) {
      setError(`You can attach up to ${maxFiles} files.`);
      return;
    }
    update([
      ...files,
      {
        id: `url-${Date.now()}`,
        url,
        name: url.split('/').pop() || 'Evidence',
        previewUrl: url,
        ocrFlagged: false,
      },
    ]);
    setUrlDraft('');
    setError('');
  };

  const removeAt = (id) => {
    update(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload evidence
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="flex gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          disabled={disabled}
          placeholder="Or paste evidence URL…"
          className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={disabled || !urlDraft.trim()}
          onClick={addUrl}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
        >
          Add
        </button>
      </div>

      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}

      {Object.keys(progress).length > 0 && (
        <div className="space-y-1">
          {Object.entries(progress).map(([name, pct]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{name}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full brand-gradient transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {files.map((file) => (
            <li key={file.id} className="flex gap-3 rounded-2xl border border-border p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                {file.previewUrl || file.url ? (
                  <img src={file.previewUrl || file.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center"><FileImage className="h-5 w-5 text-muted-foreground" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file.name || 'Evidence'}</p>
                {file.ocrFlagged ? (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                    <AlertTriangle className="h-3 w-3" /> OCR review flagged
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Ready</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    download={file.name}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Preview / Download
                  </a>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeAt(file.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DisputeEvidenceUpload;
