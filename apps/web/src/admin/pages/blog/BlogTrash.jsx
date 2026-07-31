import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RotateCcw, Trash } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import {
  getTrashedBlogPosts, restoreBlogPost, permanentlyDeleteBlogPost,
  bulkRestoreBlogPosts, bulkPermanentlyDeleteBlogPosts,
} from '../../api/blogPosts';
import { getBlogCategories } from '../../api/blogCategories';
import { useToast } from '../../../hooks/use-toast';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

const BlogTrash = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getTrashedBlogPosts(), getBlogCategories()]).then(([p, c]) => {
      setPosts(p);
      setCategories(c);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '—';

  const handleRestore = async (row) => {
    await restoreBlogPost(row.id);
    toast({ title: 'Post restored', description: row.title });
    load();
  };

  const handlePermanentDelete = async () => {
    setBusy(true);
    await permanentlyDeleteBlogPost(deleteTarget.id);
    toast({ title: 'Post permanently deleted', description: deleteTarget.title });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Trash"
        description={`${posts.length} post(s) in Trash`}
        backTo="/admin/blog"
        backLabel="All Posts"
      />

      <DataTable
        isLoading={loading}
        data={posts}
        searchKeys={['title', 'slug']}
        bulkActions={[
          {
            label: 'Restore',
            onClick: async (ids) => {
              await bulkRestoreBlogPosts(ids);
              toast({ title: `${ids.length} post(s) restored` });
              load();
            },
          },
          {
            label: 'Delete Permanently',
            destructive: true,
            onClick: async (ids) => {
              await bulkPermanentlyDeleteBlogPosts(ids);
              toast({ title: `${ids.length} post(s) permanently deleted` });
              load();
            },
          },
        ]}
        columns={[
          {
            key: 'title', label: 'Post', render: (row) => (
              <div className="flex items-center gap-3 min-w-[240px]">
                <img src={row.featuredImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 grayscale opacity-70" />
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{row.title}</p>
                  <p className="text-xs text-muted-foreground">/blog/{row.slug}</p>
                </div>
              </div>
            ),
          },
          { key: 'categoryId', label: 'Category', render: (row) => categoryName(row.categoryId) },
          { key: 'deletedAt', label: 'Deleted', render: (row) => formatDate(row.deletedAt) },
        ]}
        rowActions={(row) => [
          { label: 'Restore', icon: RotateCcw, onClick: () => handleRestore(row) },
          { separator: true },
          { label: 'Delete Permanently', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{
          icon: Trash,
          title: 'Trash is empty',
          description: 'Posts you move to Trash from All Posts will show up here.',
          action: (
            <button onClick={() => navigate('/admin/blog')} className="px-4 py-2 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              Back to All Posts
            </button>
          ),
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Permanently delete this post?"
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed. This cannot be undone.` : ''}
        onConfirm={handlePermanentDelete}
        busy={busy}
        confirmLabel="Delete Permanently"
        busyLabel="Deleting…"
      />
    </div>
  );
};

export default BlogTrash;
