import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getSettings, updateSettings } from '../../api/settings';
import { useToast } from '../../../hooks/use-toast';

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

/** Generic add/edit/remove list editor shared by zones, methods, tax
 * rules, and commission rules — each row is a small set of fields
 * defined by `columns`, keeping this one component reusable for all four. */
const RuleRepeater = ({ title, hint, rows = [], onChange, columns, addLabel, newRow }) => {
  const updateAt = (idx, key, val) => onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));
  const removeAt = (idx) => onChange(rows.filter((_, i) => i !== idx));
  const addRow = () => onChange([...rows, { id: `row-${Date.now()}`, ...newRow }]);

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {rows.map((row, idx) => (
        <div key={row.id || idx} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 bg-secondary/20">
          {columns.map((col) => (
            <input
              key={col.key}
              type={col.type || 'text'}
              value={row[col.key] ?? ''}
              onChange={(e) => updateAt(idx, col.key, col.type === 'number' ? e.target.value : e.target.value)}
              placeholder={col.label}
              className={`${inputClass} flex-1 min-w-[120px]`}
            />
          ))}
          <button type="button" onClick={() => removeAt(idx)} aria-label="Remove row" className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-border text-sm font-medium hover:bg-secondary transition-colors">
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
};

const Settings = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSettings().then(setForm); }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast({ title: 'Settings saved' });
    } catch (err) {
      toast({ title: 'Could not save settings', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Store configuration and preferences."
        actions={
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      <Tabs defaultValue="general">
        <TabsList className="bg-white border border-border rounded-full p-1.5 h-auto mb-6">
          <TabsTrigger value="general" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">General</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">Access & Fees</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">Notifications</TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-full px-4 py-2 data-[state=active]:brand-gradient data-[state=active]:text-white data-[state=active]:shadow-none">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
            <ImageUploadInput label="Store Logo" value={form.logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
            <div>
              <label className="block text-sm font-medium mb-1.5">Store Name</label>
              <input value={form.storeName} onChange={set('storeName')} className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Store Email</label>
                <input type="email" value={form.storeEmail} onChange={set('storeEmail')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Store Phone</label>
                <input value={form.storePhone} onChange={set('storePhone')} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <textarea value={form.address} onChange={set('address')} className={textareaClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Currency</label>
                <Select value={form.currency} onValueChange={set('currency')}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="PKR">PKR (₨)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Timezone</label>
                <input value={form.timezone} onChange={set('timezone')} className={inputClass} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <div className="space-y-5 max-w-2xl">
            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-sm">Store Promotion</h3>
              <ToggleRow
                label="Enable store promotion"
                description="Allow sellers to purchase Featured Seller promotion from their wallet."
                checked={!!form.storePromotionEnabled}
                onChange={(v) => setForm((f) => ({ ...f, storePromotionEnabled: v }))}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Promotion Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.storePromotionPriceUsd ?? 10}
                    onChange={set('storePromotionPriceUsd')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    value={form.storePromotionDurationHours ?? 72}
                    onChange={set('storePromotionDurationHours')}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Default 72 hours (3 days).</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-sm">Seller Verification</h3>
              <ToggleRow
                label="Verification Enabled"
                description="Allow sellers to purchase a permanent Verified Seller badge from their wallet."
                checked={!!form.sellerVerificationEnabled}
                onChange={(v) => setForm((f) => ({ ...f, sellerVerificationEnabled: v }))}
              />
              <ToggleRow
                label="Allow Manual Verification"
                description="Let admins grant or remove verification without a wallet payment."
                checked={!!form.allowManualSellerVerification}
                onChange={(v) => setForm((f) => ({ ...f, allowManualSellerVerification: v }))}
              />
              <div>
                <label className="block text-sm font-medium mb-1.5">Verification Fee ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellerVerificationFeeUsd ?? 10}
                  onChange={set('sellerVerificationFeeUsd')}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1">Default $10. One-time, never expires.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-sm">General</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Default Tax Rate (%)</label>
                  <input type="number" min="0" step="0.1" value={form.taxRatePercent} onChange={set('taxRatePercent')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Access Fee ($)</label>
                  <input type="number" min="0" step="0.01" value={form.flatShippingFee} onChange={set('flatShippingFee')} className={inputClass} />
                  <p className="text-xs text-muted-foreground mt-1">Digital products usually have no delivery fee — override if needed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Platform Fee (%)</label>
                  <input type="number" min="0" step="0.1" value={form.platformFeePercent} onChange={set('platformFeePercent')} className={inputClass} />
                  <p className="text-xs text-muted-foreground mt-1">Shown as an optional preview line at checkout.</p>
                </div>
              </div>
            </div>

            <RuleRepeater
              title="Access Zones"
              hint="Group regions for future access or handoff policies."
              rows={form.shippingZones || []}
              onChange={(rows) => setForm((f) => ({ ...f, shippingZones: rows }))}
              columns={[
                { key: 'name', label: 'Zone name' },
                { key: 'countries', label: 'Countries' },
                { key: 'rate', label: 'Rate ($)', type: 'number' },
              ]}
              addLabel="Add Zone"
              newRow={{ name: '', countries: '', rate: 0 }}
            />

            <RuleRepeater
              title="Access Methods"
              hint="Delivery options buyers can choose at checkout."
              rows={form.shippingMethods || []}
              onChange={(rows) => setForm((f) => ({ ...f, shippingMethods: rows }))}
              columns={[
                { key: 'name', label: 'Method name' },
                { key: 'cost', label: 'Cost ($)', type: 'number' },
                { key: 'estimatedDays', label: 'Estimated delivery' },
              ]}
              addLabel="Add Method"
              newRow={{ name: '', cost: 0, estimatedDays: '' }}
            />

            <RuleRepeater
              title="Tax Rules"
              hint="Per-region tax rates and tax classes."
              rows={form.taxRules || []}
              onChange={(rows) => setForm((f) => ({ ...f, taxRules: rows }))}
              columns={[
                { key: 'region', label: 'Region' },
                { key: 'rate', label: 'Rate (%)', type: 'number' },
                { key: 'taxClass', label: 'Tax class' },
              ]}
              addLabel="Add Tax Rule"
              newRow={{ region: '', rate: 0, taxClass: 'Standard' }}
            />

            <RuleRepeater
              title="Commission Rules"
              hint="Platform commission rate by category or seller tier — used for the Commission Preview shown in the product editor."
              rows={form.commissionRules || []}
              onChange={(rows) => setForm((f) => ({ ...f, commissionRules: rows }))}
              columns={[
                { key: 'scope', label: 'Category / Seller tier' },
                { key: 'rate', label: 'Commission (%)', type: 'number' },
              ]}
              addLabel="Add Commission Rule"
              newRow={{ scope: '', rate: 15 }}
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="bg-white rounded-2xl border border-border p-5 max-w-2xl">
            <ToggleRow label="New order emails" description="Notify admins when a new order comes in." checked={form.emailNewOrder} onChange={set('emailNewOrder')} />
            <ToggleRow label="Low stock emails" description="Notify admins when a product falls below its reorder point." checked={form.emailLowStock} onChange={set('emailLowStock')} />
            <ToggleRow label="New review emails" description="Notify admins when a customer leaves a review." checked={form.emailNewReview} onChange={set('emailNewReview')} />
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="bg-white rounded-2xl border border-border p-5 max-w-2xl">
            <ToggleRow label="Maintenance mode" description="Temporarily take the storefront offline for visitors." checked={form.maintenanceMode} onChange={set('maintenanceMode')} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
