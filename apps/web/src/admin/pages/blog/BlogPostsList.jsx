import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Copy, Trash, Send, FileEdit } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import {
  getBlogPosts, trashBlogPost, duplicateBlogPost,
  bulkSetBlogPostsStatus, bulkTrashBlogPosts, bulkDuplicateBlogPosts,
} from '../../api/blogPosts';
import { getBlogCategories } from '../../api/blogCategories';
import { getBlogAuthors } from '../../api/blogAuthors';
import { useToast } from '../../../hooks/use-toast';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

const BlogPostsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trashTarget, setTrashTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getBlogPosts(), getBlogCategories(), getBlogAuthors()]).then(([p, c, a]) => {
      setPosts(p);
      setCategories(c);
      setAuthors(a);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '—';
  const authorName = (id) => authors.find((a) => a.id === id)?.name || '—';

  const handleDuplicate = async (row) => {
    await duplicateBlogPost(row.id);
    toast({ title: 'Post duplicated', description: `"${row.title}" copied as a draft` });
    load();
  };

  const handleTrash = async () => {
    setBusy(true);
    await trashBlogPost(trashTarget.id);
    toast({ title: 'Post moved to Trash', description: trashTarget.title });
    setBusy(false);
    setTrashTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="All Posts"
        description={`${posts.length} posts`}
        actions={
          <>
            <Link to="/admin/blog/trash" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              <Trash className="w-4 h-4" /> Trash
            </Link>
            <button
              onClick={() => navigate('/admin/blog/new')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow"
            >
              <Plus className="w-4 h-4" /> Add New Post
            </button>
          </>
        }
      />

      <DataTable
        isLoading={loading}
        data={posts}
        searchKeys={['title', 'slug']}
        filters={[
          { key: 'status', label: 'Status', options: [{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }, { value: 'scheduled', label: 'Scheduled' }] },
          { key: 'categoryId', label: 'Category', options: categories.map((c) => ({ value: c.id, label: c.name })) },
        ]}
        bulkActions={[
          {
            label: 'Publish',
            onClick: async (ids) => {
              await bulkSetBlogPostsStatus(ids, 'published');
              toast({ title: `${ids.length} post(s) published` });
              load();
            },
          },
          {
            label: 'Set to Draft',
            onClick: async (ids) => {
              await bulkSetBlogPostsStatus(ids, 'draft');
              toast({ title: `${ids.length} post(s) set to draft` });
              load();
            },
          },
          {
            label: 'Duplicate',
            onClick: async (ids) => {
              await bulkDuplicateBlogPosts(ids);
              toast({ title: `${ids.length} post(s) duplicated` });
              load();
            },
          },
          {
            label: 'Move to Trash',
            destructive: true,
            onClick: async (ids) => {
              await bulkTrashBlogPosts(ids);
              toast({ title: `${ids.length} post(s) moved to Trash` });
              load();
            },
          },
        ]}
        onRowClick={(row) => navigate(`/admin/blog/edit/${row.id}`)}
        columns={[
          {
            key: 'title', label: 'Post', render: (row) => (
              <div className="flex items-center gap-3 min-w-[240px]">
                <img src={row.featuredImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{row.title}</p>
                  <p className="text-xs text-muted-foreground">/blog/{row.slug}</p>
                </div>
              </div>
            ),
          },
          { key: 'categoryId', label: 'Category', render: (row) => categoryName(row.categoryId) },
          { key: 'authorId', label: 'Author', render: (row) => authorName(row.authorId) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) },
          { key: 'updatedAt', label: 'Updated', render: (row) => formatDate(row.updatedAt) },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => navigate(`/admin/blog/edit/${row.id}`) },
          { label: 'Preview', icon: Eye, onClick: () => window.open(`/blog/${row.slug}?preview=1`, '_blank', 'noopener') },
          { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(row) },
          { separator: true },
          ...(row.status !== 'published' ? [{ label: 'Publish', icon: Send, onClick: async () => { await bulkSetBlogPostsStatus([row.id], 'published'); toast({ title: 'Post published', description: row.title }); load(); } }] : [{ label: 'Set to Draft', icon: FileEdit, onClick: async () => { await bulkSetBlogPostsStatus([row.id], 'draft'); toast({ title: 'Post set to draft', description: row.title }); load(); } }]),
          { separator: true },
          { label: 'Move to Trash', icon: Trash2, destructive: true, onClick: () => setTrashTarget(row) },
        ]}
        emptyState={{ title: 'No blog posts yet', description: 'Create your first post to get started.' }}
      />

      <ConfirmDeleteDialog
        open={!!trashTarget}
        onOpenChange={(v) => !v && setTrashTarget(null)}
        title="Move this post to Trash?"
        description={trashTarget ? `"${trashTarget.title}" will be moved to Trash. You can restore it or permanently delete it from there.` : ''}
        onConfirm={handleTrash}
        busy={busy}
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
      />
    </div>
  );
};

export default BlogPostsList;
