import React from 'react';
import { Download } from 'lucide-react';
import EmptyState from '../../../admin/components/EmptyState';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const SellerDownloadsTab = ({ downloads }) => (
  <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
    {downloads.length === 0 ? (
      <EmptyState icon={Download} title="No downloads yet" description="Buyer download activity for your products will show up here." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Product</th>
              <th className="px-5 py-3 font-semibold">Buyer</th>
              <th className="px-5 py-3 font-semibold">Download Count</th>
              <th className="px-5 py-3 font-semibold">Last Download</th>
              <th className="px-5 py-3 font-semibold">License</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {downloads.map((d) => (
              <tr key={d.id}>
                <td className="px-5 py-3.5 font-medium">
                  <div className="flex items-center gap-2.5">
                    <img src={d.productImg} alt="" className="w-9 h-9 rounded-lg object-cover bg-secondary shrink-0" />
                    <span className="truncate max-w-[220px]">{d.product}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">{d.buyer}</td>
                <td className="px-5 py-3.5 flex items-center gap-1.5 text-muted-foreground"><Download className="w-3.5 h-3.5" /> {d.downloadCount}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(d.lastDownload)}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary">{d.license}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default SellerDownloadsTab;
