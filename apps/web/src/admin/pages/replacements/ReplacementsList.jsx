import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Replace } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getOcrQueue } from '../../api/adminOps';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const ReplacementsList = () => {
  const navigate = useNavigate();
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOcrQueue().then(({ replacements }) => {
      setReplacements(Array.isArray(replacements) ? replacements : []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Replacement Reviews" description={`${replacements.length} pending replacements`} />

      <DataTable
        isLoading={loading}
        data={replacements}
        searchKeys={['status', '_id']}
        filters={[
          { key: 'status', label: 'Status', options: ['pending', 'accepted', 'rejected', 'superseded'].map((s) => ({ value: s, label: s })) },
        ]}
        columns={[
          { key: '_id', label: 'ID', render: (row) => <span className="font-medium">{String(row._id || row.id)}</span> },
          { key: 'dispute', label: 'Dispute', render: (row) => String(row.dispute || '—') },
          { key: 'order', label: 'Order', render: (row) => String(row.order || '—') },
          { key: 'updatedAt', label: 'Updated', render: (row) => fmtDate(row.updatedAt || row.createdAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status || 'pending'} /> },
        ]}
        rowActions={(row) => [
          ...(row.dispute ? [{ label: 'View Dispute', icon: Eye, onClick: () => navigate(`/admin/disputes/${row.dispute}`) }] : []),
        ]}
        emptyState={{ icon: Replace, title: 'No replacement reviews pending' }}
      />
    </div>
  );
};

export default ReplacementsList;
