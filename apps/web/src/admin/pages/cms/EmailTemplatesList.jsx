import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Mail } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getEmailTemplates } from '../../api/emailTemplates';

const EmailTemplatesList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getEmailTemplates().then((r) => { setRows(r); setLoading(false); }); }, []);

  return (
    <div>
      <PageHeader title="Email Templates" description="Transactional and marketing emails sent to customers and sellers." />

      <DataTable
        isLoading={loading}
        data={rows}
        searchKeys={['name', 'subject']}
        onRowClick={(row) => navigate(`/admin/cms/email-templates/${row.id}/edit`)}
        columns={[
          { key: 'name', label: 'Template', render: (row) => <p className="font-medium">{row.name}</p> },
          { key: 'subject', label: 'Subject', render: (row) => <p className="max-w-md truncate text-muted-foreground">{row.subject}</p> },
          { key: 'enabled', label: 'Status', render: (row) => <StatusBadge status={row.enabled ? 'active' : 'inactive'} /> },
        ]}
        rowActions={(row) => [
          { label: 'Edit', icon: Pencil, onClick: () => navigate(`/admin/cms/email-templates/${row.id}/edit`) },
        ]}
        emptyState={{ icon: Mail, title: 'No templates yet' }}
      />
    </div>
  );
};

export default EmailTemplatesList;
