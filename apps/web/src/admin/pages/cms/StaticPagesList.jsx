import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, FileStack } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getStaticPages } from '../../api/staticPages';

const StaticPagesList = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getStaticPages().then((rows) => { setPages(rows); setLoading(false); }); }, []);

  return (
    <div>
      <PageHeader title="Static Pages" description="Legal and informational pages shown across the storefront." />

      <DataTable
        isLoading={loading}
        data={pages}
        searchKeys={['title', 'slug']}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }] }]}
        onRowClick={(row) => navigate(`/admin/cms/pages/${row.id}/edit`)}
        columns={[
          { key: 'title', label: 'Page', render: (row) => <p className="font-medium">{row.title}</p> },
          { key: 'slug', label: 'URL', render: (row) => <code className="text-xs text-muted-foreground">/{row.slug}</code> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => navigate(`/admin/cms/pages/${row.id}/edit`) },
        ]}
        emptyState={{ icon: FileStack, title: 'No pages yet' }}
      />
    </div>
  );
};

export default StaticPagesList;
