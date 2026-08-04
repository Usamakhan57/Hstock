import React, { useEffect, useState } from 'react';
import { Megaphone, Clock3, Ban, BarChart3 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormSheet, { inputClass } from '../../components/FormSheet';
import {
  listStorePromotions,
  getPromotionAnalytics,
  extendPromotion,
  cancelPromotion,
} from '../../api/storePromotions';
import { useToast } from '../../../hooks/use-toast';

const PromotionsList = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extendTarget, setExtendTarget] = useState(null);
  const [hours, setHours] = useState('72');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        listStorePromotions({ limit: 100 }),
        getPromotionAnalytics(),
      ]);
      setRows(list.items || []);
      setAnalytics(stats);
    } catch (err) {
      toast({ title: 'Failed to load promotions', description: err?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExtend = async () => {
    if (!extendTarget) return;
    setBusy(true);
    try {
      await extendPromotion(extendTarget.id || extendTarget._id, hours);
      toast({ title: 'Promotion extended', description: `+${hours} hours` });
      setExtendTarget(null);
      await load();
    } catch (err) {
      toast({ title: 'Extend failed', description: err?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (row) => {
    if (!window.confirm(`Cancel promotion for ${row.sellerId?.storeName || 'seller'}?`)) return;
    setBusy(true);
    try {
      await cancelPromotion(row.id || row._id, 'Cancelled by admin');
      toast({ title: 'Promotion cancelled' });
      await load();
    } catch (err) {
      toast({ title: 'Cancel failed', description: err?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Store Promotions"
        description="Paid Featured Seller promotions funded from seller wallets."
      />

      {analytics ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Purchases', value: analytics.purchases, icon: Megaphone },
            { label: 'Revenue', value: `$${Number(analytics.revenue || 0).toFixed(2)}`, icon: BarChart3 },
            { label: 'Active', value: analytics.active, icon: Clock3 },
            { label: 'Orders from promo', value: analytics.ordersGenerated, icon: Ban },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <card.icon className="h-3.5 w-3.5" /> {card.label}
              </div>
              <p className="mt-2 text-2xl font-black">{card.value}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Engagement</p>
            <p className="mt-2 text-sm text-foreground">
              Views {analytics.views || 0} · Clicks {analytics.clicks || 0} · Expired {analytics.expired || 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Price / duration are configured under Settings → Access & Fees (Store Promotion).
            </p>
          </div>
        </div>
      ) : null}

      <DataTable
        isLoading={loading}
        data={rows}
        searchKeys={['paymentId']}
        filters={[
          { key: 'status', label: 'Status', options: [
            { value: 'active', label: 'Active' },
            { value: 'expired', label: 'Expired' },
            { value: 'cancelled', label: 'Cancelled' },
          ] },
        ]}
        columns={[
          {
            key: 'seller',
            label: 'Seller',
            render: (row) => (
              <div>
                <p className="font-semibold">{row.sellerId?.storeName || '—'}</p>
                <p className="text-xs text-muted-foreground">/{row.sellerId?.slug || '—'}</p>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.isActive ? 'active' : row.status} />,
          },
          {
            key: 'amount',
            label: 'Amount',
            render: (row) => `$${Number(row.amount || 0).toFixed(2)}`,
          },
          {
            key: 'expiresAt',
            label: 'Expires',
            render: (row) => (row.expiresAt ? new Date(row.expiresAt).toLocaleString() : '—'),
          },
          {
            key: 'analytics',
            label: 'Stats',
            render: (row) => {
              const a = row.analytics || {};
              return `${a.views || 0}v / ${a.clicks || 0}c / ${a.ordersGenerated || 0}o`;
            },
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { setExtendTarget(row); setHours('72'); }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  Extend
                </button>
                {row.status !== 'cancelled' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleCancel(row)}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <FormSheet
        open={!!extendTarget}
        onOpenChange={(open) => { if (!open) setExtendTarget(null); }}
        title="Extend promotion"
        description={extendTarget?.sellerId?.storeName || 'Seller promotion'}
        onSubmit={handleExtend}
        submitting={busy}
        submitLabel="Extend"
      >
        <div>
          <label className="block text-sm font-medium mb-1.5">Additional hours</label>
          <input
            type="number"
            min="1"
            max="8760"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputClass}
          />
        </div>
      </FormSheet>
    </div>
  );
};

export default PromotionsList;
