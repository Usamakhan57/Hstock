import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { getWalletLedger } from '../../api/wallets';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const WalletsList = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWalletLedger().then((rows) => { setEntries(rows); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="Wallets" description={`${entries.length} ledger entries`} />

      <DataTable
        isLoading={loading}
        data={entries}
        searchKeys={['sellerName', 'description', 'entryType']}
        filters={[
          { key: 'direction', label: 'Direction', options: [{ value: 'credit', label: 'Credit' }, { value: 'debit', label: 'Debit' }] },
        ]}
        columns={[
          { key: 'sellerName', label: 'Seller' },
          { key: 'entryType', label: 'Type' },
          { key: 'direction', label: 'Direction', render: (row) => <span className="capitalize">{row.direction || '—'}</span> },
          { key: 'amount', label: 'Amount', render: (row) => fmtMoney(row.amount) },
          { key: 'description', label: 'Description' },
          { key: 'createdAt', label: 'Date', render: (row) => fmtDate(row.createdAt) },
        ]}
        emptyState={{ icon: Wallet, title: 'No ledger entries' }}
      />
    </div>
  );
};

export default WalletsList;
