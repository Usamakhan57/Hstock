import React, { useEffect, useState } from 'react';
import { Shield, Unlock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getEscrows, releaseEscrow } from '../../api/escrow';
import { useToast } from '../../../hooks/use-toast';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const EscrowList = () => {
  const { toast } = useToast();
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getEscrows().then((rows) => { setEscrows(rows); setLoading(false); });
  };

  useEffect(load, []);

  const handleRelease = async (row) => {
    await releaseEscrow(row.id);
    toast({ title: 'Escrow released', description: row.orderNumber || row.id });
    load();
  };

  return (
    <div>
      <PageHeader title="Escrow" description={`${escrows.length} escrow records`} />

      <DataTable
        isLoading={loading}
        data={escrows}
        searchKeys={['orderNumber', 'status']}
        filters={[
          { key: 'status', label: 'Status', options: ['locked', 'released', 'refunded', 'disputed'].map((s) => ({ value: s, label: s })) },
        ]}
        columns={[
          { key: 'orderNumber', label: 'Order', render: (row) => <span className="font-semibold text-primary">{row.orderNumber || '—'}</span> },
          { key: 'amount', label: 'Amount', render: (row) => fmtMoney(row.amount) },
          { key: 'sellerAmount', label: 'Seller', render: (row) => fmtMoney(row.sellerAmount) },
          { key: 'lockedAt', label: 'Locked', render: (row) => fmtDate(row.lockedAt) },
          { key: 'releaseAt', label: 'Release At', render: (row) => fmtDate(row.releaseAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          ...(row.status === 'locked' ? [{ label: 'Release', icon: Unlock, onClick: () => handleRelease(row) }] : []),
        ]}
        emptyState={{ icon: Shield, title: 'No escrow records' }}
      />
    </div>
  );
};

export default EscrowList;
