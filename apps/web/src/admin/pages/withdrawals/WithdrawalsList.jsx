import React, { useEffect, useState } from 'react';
import { Check, X, Banknote, ArrowDownToLine } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getWithdrawals, approveWithdrawal, rejectWithdrawal, payWithdrawal } from '../../api/withdrawals';
import { useToast } from '../../../hooks/use-toast';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const WithdrawalsList = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getWithdrawals().then((rows) => { setWithdrawals(rows); setLoading(false); });
  };

  useEffect(load, []);

  const runAction = async (fn, row, message) => {
    await fn(row.id);
    toast({ title: message, description: row.requestNumber || row.id });
    load();
  };

  return (
    <div>
      <PageHeader title="Withdrawals" description={`${withdrawals.length} withdrawal requests`} />

      <DataTable
        isLoading={loading}
        data={withdrawals}
        searchKeys={['requestNumber', 'sellerName', 'walletAddress']}
        filters={[
          { key: 'status', label: 'Status', options: ['pending', 'approved', 'rejected', 'paid', 'cancelled'].map((s) => ({ value: s, label: s })) },
        ]}
        columns={[
          { key: 'requestNumber', label: 'Request', render: (row) => <span className="font-semibold">{row.requestNumber}</span> },
          { key: 'sellerName', label: 'Seller' },
          { key: 'amount', label: 'Amount', render: (row) => fmtMoney(row.amount) },
          { key: 'coin', label: 'Coin' },
          { key: 'network', label: 'Network' },
          { key: 'createdAt', label: 'Requested', render: (row) => fmtDate(row.createdAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          ...(row.status === 'pending' ? [
            { label: 'Approve', icon: Check, onClick: () => runAction(approveWithdrawal, row, 'Withdrawal approved') },
            { label: 'Reject', icon: X, onClick: () => runAction(rejectWithdrawal, row, 'Withdrawal rejected') },
          ] : []),
          ...(row.status === 'approved' ? [
            { label: 'Mark Paid', icon: Banknote, onClick: () => runAction(payWithdrawal, row, 'Withdrawal marked paid') },
          ] : []),
        ]}
        emptyState={{ icon: ArrowDownToLine, title: 'No withdrawal requests' }}
      />
    </div>
  );
};

export default WithdrawalsList;
