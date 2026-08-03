import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductGridSkeleton } from '../../components/Skeletons';
import { useFetch } from '../../hooks/useFetch';
import { ordersApi } from '../../services/ordersApi';
import { useToast } from '../../hooks/use-toast';
import { ORDER_STATUS } from '../../constants/commerce';

const PAGE_SIZE = 6;

const DownloadsPage = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, retry } = useFetch(
    () => ordersApi.list({ page: 1, limit: 100, scope: 'buyer' }),
    [],
  );

  const orders = data?.items || [];
  const items = useMemo(
    () => orders
      .filter((o) => [ORDER_STATUS.PAID, ORDER_STATUS.ESCROW, ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(o.status))
      .map((o) => ({
        ...o.product,
        orderId: o.id,
        orderMongoId: o._id,
        date: o.date,
        statusLabel: o.deliveryStatus === 'delivered' ? 'Delivered' : o.statusLabel,
        deliveryStatus: o.deliveryStatus,
      })),
    [orders],
  );

  const filtered = useMemo(
    () => items.filter((i) => !query || i.title.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeQuery = (v) => { setQuery(v); setPage(1); };

  const download = async (item) => {
    try {
      const delivery = await ordersApi.getDelivery(item.orderMongoId || item.orderId);
      if (!delivery?.delivered || !delivery.accounts?.length) {
        toast({
          title: 'Delivery not ready',
          description: `${item.title} — open the order for delivery status.`,
        });
        return;
      }
      const lines = delivery.accounts.map((account, index) => {
        const fields = account.fields || {};
        const body = Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join('\n');
        return `Account ${index + 1}\n${body}`;
      }).join('\n\n');
      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${item.orderId}-credentials.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Could not download',
        description: err.message || 'Open the order to view credentials.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Seo title="My Downloads" description="Re-download every file you've purchased on ApnaStore." noIndex />
      <AccountLayout title="Downloads" subtitle="Every file you've purchased, ready to re-download any time.">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-border mb-6 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Search your downloads…"
            aria-label="Search downloads"
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : error ? (
          <NetworkErrorState onRetry={retry} message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? 'No downloads yet' : 'No downloads match your search'}
            message={items.length === 0 ? 'Files you purchase will appear here after payment is verified.' : 'Try a different search term.'}
            actionLabel="Browse the Shop"
            actionTo="/shop"
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {pageItems.map((item) => (
                <div key={`${item.orderId}-${item.id}`} className="bg-white rounded-3xl border border-border soft-shadow p-5 flex items-center gap-4">
                  <Link to={item.id ? `/product/${item.id}` : `/orders/${item.orderId}`} className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary shrink-0">
                    {item.img ? <img src={item.img} alt="" className="w-full h-full object-cover" /> : null}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.statusLabel} · {item.orderId}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button type="button" onClick={() => download(item)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full brand-gradient text-white">
                        <Download className="w-3.5 h-3.5" /> Access
                      </button>
                      <Link to={`/orders/${item.orderId}`} className="text-xs font-semibold text-primary hover:underline">Order details</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="w-9 h-9 grid place-items-center rounded-full border border-border disabled:opacity-40" aria-label="Previous page">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="w-9 h-9 grid place-items-center rounded-full border border-border disabled:opacity-40" aria-label="Next page">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </AccountLayout>
    </>
  );
};

export default DownloadsPage;
