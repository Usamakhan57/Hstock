import React, { useEffect, useState } from 'react';
import { ScanLine } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { getOcrQueue } from '../../api/adminOps';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const OcrReviewQueue = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOcrQueue().then(({ items: rows }) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="OCR Review" description={`${items.length} flagged attachments`} />

      <DataTable
        isLoading={loading}
        data={items}
        searchKeys={['attachment.filename', 'attachment.url']}
        columns={[
          { key: 'disputeId', label: 'Dispute', render: (row) => <span className="font-medium">{String(row.disputeId || '—')}</span> },
          { key: 'orderId', label: 'Order', render: (row) => String(row.orderId || '—') },
          { key: 'author', label: 'Author', render: (row) => row.author?.name || row.author?.email || '—' },
          { key: 'attachment', label: 'File', render: (row) => (
            <a href={row.attachment?.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
              {row.attachment?.filename || row.attachment?.url || 'View'}
            </a>
          ) },
          { key: 'createdAt', label: 'Flagged', render: (row) => fmtDate(row.createdAt) },
        ]}
        emptyState={{ icon: ScanLine, title: 'OCR queue is clear' }}
      />
    </div>
  );
};

export default OcrReviewQueue;
