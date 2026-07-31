import React, { useEffect, useState } from 'react';
import { Check, X, Trash2, MessageSquare } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import { getBlogComments, updateBlogComment, deleteBlogComment } from '../../api/blogComments';
import { getBlogPosts } from '../../api/blogPosts';
import { useToast } from '../../../hooks/use-toast';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Comment moderation is future-ready: fully wired to its own mock
 * resource and admin UI now, even though the live Blog page does not
 * post comments yet. When commenting ships on the frontend, this page
 * and its API already exist — no admin work needed at that point.
 */
const BlogComments = () => {
  const { toast } = useToast();
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getBlogComments(), getBlogPosts()]).then(([c, p]) => {
      setComments(c);
      setPosts(p);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const postTitle = (postId) => posts.find((p) => p.id === postId)?.title || '—';

  const moderate = async (row, status) => {
    await updateBlogComment(row.id, { status });
    toast({ title: status === 'approved' ? 'Comment approved' : 'Comment rejected' });
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteBlogComment(deleteTarget.id);
    toast({ title: 'Comment deleted' });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader title="Comments" description="Moderate reader comments on blog posts." />

      <DataTable
        isLoading={loading}
        data={comments}
        searchKeys={['authorName', 'content']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] }]}
        columns={[
          {
            key: 'content', label: 'Comment', render: (row) => (
              <div className="max-w-sm">
                <p className="text-sm line-clamp-2">{row.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{row.authorName} · {formatDate(row.createdAt)}</p>
              </div>
            ),
          },
          { key: 'postId', label: 'Post', render: (row) => <span className="line-clamp-1 max-w-[180px] block">{postTitle(row.postId)}</span> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Approve', icon: Check, onClick: () => moderate(row, 'approved') },
          { label: 'Reject', icon: X, onClick: () => moderate(row, 'rejected') },
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{
          icon: MessageSquare,
          title: 'No comments yet',
          description: 'Comments will appear here once reader commenting is enabled on the Blog page.',
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this comment?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default BlogComments;
