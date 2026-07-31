import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Minus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { inputClass } from '../../components/FormSheet';
import { getInventory, adjustStock } from '../../api/inventory';
import { useToast } from '../../../hooks/use-toast';

const InventoryList = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); getInventory().then((i) => { setInventory(i); setLoading(false); }); };
  useEffect(load, []);

  const openAdjust = (row) => { setAdjustTarget(row); setDelta(''); setReason(''); };

  const applyAdjust = async (sign) => {
    const amount = Number(delta);
    if (!amount || amount <= 0) { toast({ title: 'Enter a quantity', variant: 'destructive' }); return; }
    setSaving(true);
    await adjustStock(adjustTarget.id, sign * amount, reason);
    toast({ title: 'Stock updated', description: `${adjustTarget.title}: ${sign > 0 ? '+' : '-'}${amount}` });
    setSaving(false);
    setAdjustTarget(null);
    load();
  };

  return (
    <div>
      <PageHeader title="Inventory" description={`${inventory.length} tracked products`} />

      <DataTable
        isLoading={loading}
        data={inventory}
        searchKeys={['title', 'sku']}
        filters={[{ key: 'status', label: 'Stock', options: [{ value: 'in_stock', label: 'In Stock' }, { value: 'low_stock', label: 'Low Stock' }, { value: 'out_of_stock', label: 'Out of Stock' }] }]}
        columns={[
          {
            key: 'title', label: 'Product', render: (row) => (
              <div className="flex items-center gap-3">
                <img src={row.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.sku}</p>
                </div>
              </div>
            ),
          },
          { key: 'stock', label: 'Stock', render: (row) => <span className="font-semibold">{row.stock}</span> },
          { key: 'lowStockThreshold', label: 'Reorder Point' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions', label: '', render: (row) => (
              <button
                data-no-row-click
                onClick={() => openAdjust(row)}
                className="text-xs font-semibold text-primary px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                Adjust Stock
              </button>
            ),
          },
        ]}
        emptyState={{ icon: Boxes, title: 'No inventory records' }}
      />

      <Dialog open={!!adjustTarget} onOpenChange={(v) => !v && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustTarget?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Current stock: <span className="font-semibold text-foreground">{adjustTarget?.stock}</span></p>
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantity</label>
              <input type="number" min="1" value={delta} onChange={(e) => setDelta(e.target.value)} className={inputClass} placeholder="e.g. 50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reason (optional)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="e.g. Restock, correction…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button disabled={saving} onClick={() => applyAdjust(-1)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary disabled:opacity-60">
              <Minus className="w-4 h-4" /> Remove
            </button>
            <button disabled={saving} onClick={() => applyAdjust(1)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold disabled:opacity-60">
              <Plus className="w-4 h-4" /> Add
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryList;
