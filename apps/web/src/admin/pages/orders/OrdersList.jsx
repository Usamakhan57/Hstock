import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, ShoppingCart, Undo2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';
import { getOrders, deleteOrder, updateOrder } from '../../api/orders';
import { useToast } from '../../../hooks/use-toast';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const OrdersList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { setLoading(true); getOrders().then((o) => { setOrders(o); setLoading(false); }); };
  useEffect(load, []);

  const handleDelete = async () => {
    setBusy(true);
    await deleteOrder(deleteTarget.id);
    toast({ title: 'Order deleted', description: `#${deleteTarget.id.replace('ord-', '')}` });
    setBusy(false);
    setDeleteTarget(null);
    load();
  };

  const handleRefund = async (row) => {
    await updateOrder(row.id, { paymentStatus: 'refunded', status: 'cancelled' });
    toast({ title: 'Order refunded', description: `#${row.id.replace('ord-', '')}` });
    load();
  };

  return (
    <div>
      <PageHeader title="Orders" description={`${orders.length} orders`} />

      <DataTable
        isLoading={loading}
        data={orders}
        searchKeys={['id', 'customerName', 'email']}
        filters={[
          { key: 'status', label: 'Status', options: ['pending', 'processing', 'shipped', 'completed', 'cancelled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) },
          { key: 'paymentStatus', label: 'Payment', options: [{ value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }, { value: 'refunded', label: 'Refunded' }] },
        ]}
        onRowClick={(row) => navigate(`/admin/orders/${row.id}`)}
        columns={[
          { key: 'id', label: 'Order', render: (row) => <span className="font-semibold text-primary">#{row.id.replace('ord-', '')}</span> },
          { key: 'customerName', label: 'Customer', render: (row) => (<div><p className="font-medium">{row.customerName}</p><p className="text-xs text-muted-foreground">{row.email}</p></div>) },
          { key: 'createdAt', label: 'Date', render: (row) => fmtDate(row.createdAt) },
          { key: 'items', label: 'Items', render: (row) => row.items.reduce((s, i) => s + i.qty, 0) },
          { key: 'total', label: 'Total', render: (row) => `$${row.total.toFixed(2)}` },
          { key: 'paymentStatus', label: 'Payment', render: (row) => <StatusBadge status={row.paymentStatus} /> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
        rowActions={(row) => [
          { label: 'View Details', icon: Eye, onClick: () => navigate(`/admin/orders/${row.id}`) },
          ...(row.paymentStatus === 'paid' ? [{ label: 'Refund', icon: Undo2, onClick: () => handleRefund(row) }] : []),
          { separator: true },
          { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(row) },
        ]}
        emptyState={{ icon: ShoppingCart, title: 'No orders yet' }}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this order?"
        description={deleteTarget ? `Order #${deleteTarget.id.replace('ord-', '')} will be permanently removed.` : ''}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
};

export default OrdersList;
