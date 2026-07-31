import React from 'react';
import { FileText, Download } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../hooks/use-toast';

const InvoicesPage = () => {
  const { orders } = useStore();
  const { toast } = useToast();

  const invoices = orders.map((o, i) => ({
    invoiceNumber: `INV-${1000 + i}`,
    orderNumber: o.id,
    amount: o.amount,
    date: o.date,
  }));

  const downloadPdf = (inv) => {
    toast({ title: 'Invoice download started', description: `${inv.invoiceNumber} — this is a demo, no file is actually sent.` });
  };

  return (
    <>
      <Seo title="Invoices" description="Download invoices for your HStock orders." noIndex />
      <AccountLayout title="Invoices" subtitle="An invoice is generated automatically for every completed order.">
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" message="Invoices will appear here once you place your first order." actionLabel="Browse the Shop" actionTo="/shop" />
        ) : (
          <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
              <span>Invoice Number</span>
              <span>Order Number</span>
              <span>Amount</span>
              <span>Date</span>
              <span className="text-right">Action</span>
            </div>
            <ul className="divide-y divide-border">
              {invoices.map((inv) => (
                <li key={inv.invoiceNumber} className="grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 items-center px-5 py-4">
                  <span className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary shrink-0 sm:hidden" /> {inv.invoiceNumber}</span>
                  <span className="text-sm text-muted-foreground">{inv.orderNumber}</span>
                  <span className="text-sm font-semibold">${inv.amount.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</span>
                  <button
                    onClick={() => downloadPdf(inv)}
                    className="inline-flex items-center gap-1.5 justify-center sm:justify-start text-xs font-semibold px-4 py-2 rounded-full border border-border hover:bg-secondary transition-colors sm:justify-self-end"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AccountLayout>
    </>
  );
};

export default InvoicesPage;
