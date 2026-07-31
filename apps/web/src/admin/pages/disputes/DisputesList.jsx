import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getDisputes } from '../../api/disputes';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const DisputesList = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDisputes().then((rows) => { setDisputes(rows); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="Disputes" description={`${disputes.length} disputes`} />

      <DataTable
        isLoading={loading}
        data={disputes}
        searchKeys={['disputeNumber', 'buyerName', 'productTitle', 'reason']}
        filters={[
          { key: 'status', label: 'Status', options: ['open', 'under_review', 'resolved', 'closed'].map((s) => ({ value: s, label: s.replace('_', ' ') })) },
        ]}
        onRowClick={(row) => navigate(`/admin/disputes/${row.id}`)}
        columns={[
          { key: 'disputeNumber', label: 'Dispute', render: (row) => <span className="font-semibold text-primary">{row.disputeNumber}</span> },
          { key: 'orderNumber', label: 'Order' },
          { key: 'buyerName', label: 'Buyer' },
          { key: 'productTitle', label: 'Product' },
          { key: 'reason', label: 'Reason' },
          { key: 'createdAt', label: 'Opened', render: (row) => fmtDate(row.createdAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'View Details', icon: Eye, onClick: () => navigate(`/admin/disputes/${row.id}`) },
        ]}
        emptyState={{ icon: AlertTriangle, title: 'No disputes' }}
      />
    </div>
  );
};

export default DisputesList;
