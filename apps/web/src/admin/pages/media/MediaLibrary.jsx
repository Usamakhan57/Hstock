import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Pencil, Copy, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { getMedia, uploadMedia, deleteMedia } from '../../api/media';
import { useToast } from '../../../hooks/use-toast';

const fmtSize = (bytes) => `${(bytes / 1_000_000).toFixed(1)} MB`;

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const MediaLibrary = () => {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getMedia().then((m) => { setMedia(m); setLoading(false); }); };
  useEffect(load, []);

  const handleUpload = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const url = await readAsDataUrl(file);
      await uploadMedia({ filename: file.name, url, type: file.type, size: file.size });
    }
    toast({ title: `${files.length} file(s) uploaded` });
    setUploading(false);
    load();
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'URL copied to clipboard' });
    } catch {
      toast({ title: 'Could not copy URL', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteMedia(deleteTarget.id);
    toast({ title: 'File deleted', description: deleteTarget.filename });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Media Library"
        description={`${media.length} files`}
        actions={
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60"
            >
              <Upload className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload Files'}
            </button>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }} />
          </>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : media.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border">
          <EmptyState icon={ImageIcon} title="No files uploaded yet" description="Upload images to use across products, categories, and banners." />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {media.map((file) => (
            <div key={file.id} className="bg-white rounded-2xl border border-border overflow-hidden group">
              <div className="aspect-square bg-secondary relative">
                <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 rounded-full bg-white shadow grid place-items-center">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyUrl(file.url)}><Copy className="w-4 h-4 mr-2" /> Copy URL</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(file)} className="text-red-600 focus:text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate">{file.filename}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{fmtSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this file?"
        description={deleteTarget ? `"${deleteTarget.filename}" will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default MediaLibrary;
