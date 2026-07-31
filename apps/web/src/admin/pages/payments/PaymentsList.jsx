import React, { useEffect, useState } from 'react';
import { RefreshCw, CreditCard } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getPayments, syncPayment } from '../../api/payments';
import { useToast } from '../../../hooks/use-toast';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const PaymentsList = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getPayments().then((rows) => { setPayments(rows); setLoading(false); });
  };

  useEffect(load, []);

  const handleSync = async (row) => {
    await syncPayment(row.id);
    toast({ title: 'Payment synced', description: row.orderNumber || row.id });
    load();
  };

  return (
    <div>
      <PageHeader title="Payments" description={`${payments.length} payment records`} />

      <DataTable
        isLoading={loading}
        data={payments}
        searchKeys={['id', 'orderNumber', 'status']}
        filters={[
          { key: 'status', label: 'Status', options: ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'].map((s) => ({ value: s, label: s })) },
        ]}
        columns={[
          { key: 'orderNumber', label: 'Order', render: (row) => <span className="font-semibold text-primary">{row.orderNumber || '—'}</span> },
          { key: 'amount', label: 'Amount', render: (row) => fmtMoney(row.amount) },
          { key: 'currency', label: 'Currency' },
          { key: 'createdAt', label: 'Created', render: (row) => fmtDate(row.createdAt) },
          { key: 'paidAt', label: 'Paid', render: (row) => fmtDate(row.paidAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'Sync Status', icon: RefreshCw, onClick: () => handleSync(row) },
        ]}
        emptyState={{ icon: CreditCard, title: 'No payments yet' }}
      />
    </div>
  );
};

export default PaymentsList;
