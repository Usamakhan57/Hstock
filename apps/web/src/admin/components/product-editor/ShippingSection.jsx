import React from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { inputClass } from '../FormSheet';

const EMPTY_SHIPPING = {
  productType: 'digital',
  weight: '', length: '', width: '', height: '',
  shippingClass: '', shipsFrom: '', processingTime: '',
  freeShipping: false, shippingCost: '', additionalItemCost: '',
  internationalShipping: false, estimatedDelivery: '', localPickup: false,
};

/**
 * `value` matches EMPTY_SHIPPING's shape; onChange receives the updated
 * object. When productType is 'digital' every physical-only field is
 * hidden automatically — ApnaStore is digital-only today, but the model
 * is ready for physical products without any component changes.
 */
const ShippingSection = ({ value = EMPTY_SHIPPING, onChange }) => {
  const set = (key) => (e) => onChange({ ...value, [key]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e });
  const isPhysical = value.productType === 'physical';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Product Type</label>
        <div className="flex gap-2">
          {['digital', 'physical'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...value, productType: t })}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-colors ${value.productType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'}`}
            >
              {t} Product
            </button>
          ))}
        </div>
        {!isPhysical && (
          <p className="text-xs text-muted-foreground mt-2">Digital products ship instantly on purchase — shipping fields are hidden.</p>
        )}
      </div>

      {isPhysical && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
              <input type="number" min="0" step="0.01" value={value.weight} onChange={set('weight')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Length (cm)</label>
              <input type="number" min="0" step="0.1" value={value.length} onChange={set('length')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Width (cm)</label>
              <input type="number" min="0" step="0.1" value={value.width} onChange={set('width')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Height (cm)</label>
              <input type="number" min="0" step="0.1" value={value.height} onChange={set('height')} className={inputClass} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Shipping Class</label>
              <Select value={value.shippingClass} onValueChange={(v) => onChange({ ...value, shippingClass: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="fragile">Fragile</SelectItem>
                  <SelectItem value="oversized">Oversized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ships From</label>
              <input value={value.shipsFrom} onChange={set('shipsFrom')} className={inputClass} placeholder="City, Country" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Processing Time</label>
              <input value={value.processingTime} onChange={set('processingTime')} className={inputClass} placeholder="e.g. 1-2 business days" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Estimated Delivery</label>
              <input value={value.estimatedDelivery} onChange={set('estimatedDelivery')} className={inputClass} placeholder="e.g. 5-7 business days" />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox checked={value.freeShipping} onCheckedChange={(v) => onChange({ ...value, freeShipping: !!v })} />
            <span className="text-sm font-semibold">Free Shipping</span>
          </label>

          {!value.freeShipping && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Shipping Cost ($)</label>
                <input type="number" min="0" step="0.01" value={value.shippingCost} onChange={set('shippingCost')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Additional Item Cost ($)</label>
                <input type="number" min="0" step="0.01" value={value.additionalItemCost} onChange={set('additionalItemCost')} className={inputClass} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={value.internationalShipping} onCheckedChange={(v) => onChange({ ...value, internationalShipping: !!v })} />
              <span className="text-sm">International Shipping</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={value.localPickup} onCheckedChange={(v) => onChange({ ...value, localPickup: !!v })} />
              <span className="text-sm">Local Pickup</span>
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export { EMPTY_SHIPPING };
export default ShippingSection;
