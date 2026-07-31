import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Search, Trash2, LayoutGrid, List as ListIcon, Check, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import ConfirmDeleteDialog from '../../admin/components/ConfirmDeleteDialog';
import EmptyState from '../../admin/components/EmptyState';
import { getMedia, uploadMedia, deleteMedia } from '../../admin/api/media';

const fmtSize = (bytes) => (bytes ? `${(bytes / 1_000_000).toFixed(1)} MB` : '');

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/**
 * Reusable Media Library picker, shared across every image field in the
 * app (Blog featured images/gallery/OG/Twitter images, category images,
 * author avatars, and anywhere else that needs one). It reads/writes
 * through admin/api/media.js only — never localStorage directly — so a
 * real media backend later is a one-file swap with no component changes.
 *
 * Usage: render once near the field(s) that need it, control `open`,
 * and handle `onSelect(urls)` — `urls` is always an array of image URLs
 * (length 1 unless `multiple`).
 */
const MediaLibraryModal = ({ open, onOpenChange, multiple = false, onSelect, title = 'Media Library' }) => {
  const inputRef = useRef(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState('grid');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getMedia().then((m) => { setMedia(m); setLoading(false); });
  };

  useEffect(() => {
    if (open) { load(); setSelectedIds([]); setQuery(''); }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return media;
    const q = query.trim().toLowerCase();
    return media.filter((m) => m.filename.toLowerCase().includes(q));
  }, [media, query]);

  const handleUpload = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const url = await readAsDataUrl(file);
      await uploadMedia({ filename: file.name, url, type: file.type, size: file.size });
    }
    setUploading(false);
    load();
  };

  const toggleSelect = (item) => {
    if (multiple) {
      setSelectedIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
    } else {
      setSelectedIds([item.id]);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteMedia(deleteTarget.id);
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  const confirmSelection = () => {
    const urls = media.filter((m) => selectedIds.includes(m.id)).map((m) => m.url);
    onSelect(urls);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-3.5 py-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search images…"
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1 bg-secondary/60 rounded-full p-1">
            <button type="button" onClick={() => setView('grid')} className={`p-1.5 rounded-full ${view === 'grid' ? 'bg-white shadow-sm' : ''}`} aria-label="Grid view">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setView('list')} className={`p-1.5 rounded-full ${view === 'list' ? 'bg-white shadow-sm' : ''}`} aria-label="List view">
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60 sm:ml-auto"
          >
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload Image'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }} />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No images found" description="Upload an image to get started." />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={`relative bg-white rounded-2xl border overflow-hidden group text-left transition-colors ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                  >
                    <div className="aspect-square bg-secondary relative">
                      <img src={item.url} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
                      {isSelected && (
                        <span className="absolute top-2 left-2 w-6 h-6 rounded-full brand-gradient text-white grid place-items-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDeleteTarget(item); } }}
                        aria-label={`Delete ${item.filename}`}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium truncate">{item.filename}</p>
                      <p className="text-[11px] text-muted-foreground">{fmtSize(item.size)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                      <img src={item.url} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.filename}</p>
                      <p className="text-xs text-muted-foreground">{fmtSize(item.size)}</p>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full brand-gradient text-white grid place-items-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDeleteTarget(item); } }}
                      aria-label={`Delete ${item.filename}`}
                      className="p-1.5 rounded-full hover:bg-secondary shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground">{selectedIds.length} selected</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-full text-sm font-semibold border border-border hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSelection}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-50"
            >
              Use {selectedIds.length > 1 ? `${selectedIds.length} Images` : 'Image'}
            </button>
          </div>
        </div>
      </DialogContent>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this image?"
        description={deleteTarget ? `"${deleteTarget.filename}" will be permanently removed from the Media Library.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </Dialog>
  );
};

export default MediaLibraryModal;
