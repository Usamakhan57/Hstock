import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../hooks/use-toast';

const PAGE_SIZE = 6;

// Deterministic mock file size per item, since the demo store doesn't track real files.
const fileSizeFor = (id) => `${(((id || 1) * 37) % 180 + 20)} MB`;

const DownloadsPage = () => {
  const { orders } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const items = useMemo(
    () => orders.map((o) => ({ ...o.product, licenseName: o.licenseName, orderId: o.id, date: o.date })),
    [orders]
  );

  const filtered = useMemo(
    () => items.filter((i) => !query || i.title.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeQuery = (v) => { setQuery(v); setPage(1); };

  const download = (item) => {
    toast({ title: 'Download started', description: `${item.title} — this is a demo, no file is actually sent.` });
  };

  return (
    <>
      <Seo title="My Downloads" description="Re-download every file you've purchased on HStock." noIndex />
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

        {filtered.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? 'No downloads yet' : 'No downloads match your search'}
            message={items.length === 0 ? 'Files you purchase will appear here for unlimited re-downloads.' : 'Try a different search term.'}
            actionLabel="Browse the Shop"
            actionTo="/shop"
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {pageItems.map((item, i) => (
                <div key={`${item.orderId}-${item.id}-${i}`} className="bg-white rounded-3xl border border-border soft-shadow p-4 flex gap-3">
                  <Link to={`/product/${item.id}`} className="w-16 h-16 rounded-xl overflow-hidden bg-secondary shrink-0">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.id}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">{item.title}</Link>
                    <p className="text-xs text-muted-foreground mt-0.5">by {item.artist || 'HStock Seller'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Purchased {new Date(item.date).toLocaleDateString()}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span>{item.licenseName || 'Personal Use'} license</span>
                      <span>·</span>
                      <span>{item.version || 'v1.0'}</span>
                      <span>·</span>
                      <span>{fileSizeFor(item.id)}</span>
                    </div>
                    <button
                      onClick={() => download(item)}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full brand-gradient text-white text-xs font-semibold hover:opacity-95 transition-opacity"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-9 h-9 grid place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-muted-foreground px-2">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-9 h-9 grid place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-bold text-lg mb-4">Download History</h2>
              <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
                <ul className="divide-y divide-border">
                  {items.slice(0, 5).map((item, i) => (
                    <li key={`hist-${item.orderId}-${item.id}-${i}`} className="flex items-center justify-between gap-4 p-4 text-sm">
                      <span className="flex-1 min-w-0 font-medium truncate">{item.title}</span>
                      <span className="text-muted-foreground shrink-0">{new Date(item.date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </AccountLayout>
    </>
  );
};

export default DownloadsPage;
