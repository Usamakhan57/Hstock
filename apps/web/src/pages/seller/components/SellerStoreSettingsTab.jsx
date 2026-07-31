import React, { useState } from 'react';
import ImageUploadInput from '../../../admin/components/ImageUploadInput';
import { inputClass, textareaClass } from '../../../admin/components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { useToast } from '../../../hooks/use-toast';

const NOTIFICATION_TOGGLES = [
  { key: 'newOrders', label: 'New order emails', hint: 'Get notified whenever a customer buys one of your products.' },
  { key: 'newReviews', label: 'New review alerts', hint: 'Get notified when a buyer leaves a review.' },
  { key: 'payouts', label: 'Payout updates', hint: 'Get notified when a withdrawal is processed.' },
  { key: 'marketing', label: 'HStock news & tips', hint: 'Occasional seller tips and platform updates.' },
];

const SellerStoreSettingsTab = ({ seller }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    logo: '', banner: '',
    storeName: seller?.storeName || '', description: '',
    email: seller?.email || '', phone: '', website: '',
    facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '',
    address: '',
    payoutMethod: 'Bitcoin', payoutWalletAddress: seller?.email || '',
    notifications: { newOrders: true, newReviews: true, payouts: true, marketing: false },
    shippingPolicy: '', defaultProcessingTime: '1-2 business days', defaultShippingCost: '0',
    freeShippingEnabled: true, freeShippingThreshold: '', countriesServed: 'Worldwide',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleNotification = (key) => setForm((f) => ({ ...f, notifications: { ...f.notifications, [key]: !f.notifications[key] } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({ title: 'Store settings saved', description: 'Your storefront settings were updated.' });
  };

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
          <h3 className="font-bold">Store Branding</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Store Logo</label>
              <ImageUploadInput value={form.logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Banner Image</label>
              <ImageUploadInput value={form.banner} onChange={(v) => setForm((f) => ({ ...f, banner: v }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Store Name</label>
            <input value={form.storeName} onChange={set('storeName')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Store Description</label>
            <textarea value={form.description} onChange={set('description')} className={textareaClass} placeholder="Tell buyers what your store is all about…" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
          <h3 className="font-bold">Contact Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Website</label>
            <input value={form.website} onChange={set('website')} className={inputClass} placeholder="https://…" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Store Address</label>
            <input value={form.address} onChange={set('address')} className={inputClass} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
          <h3 className="font-bold">Social Links</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Facebook</label>
              <input value={form.facebook} onChange={set('facebook')} className={inputClass} placeholder="https://facebook.com/…" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Instagram</label>
              <input value={form.instagram} onChange={set('instagram')} className={inputClass} placeholder="https://instagram.com/…" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Twitter</label>
              <input value={form.twitter} onChange={set('twitter')} className={inputClass} placeholder="https://twitter.com/…" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">YouTube</label>
              <input value={form.youtube} onChange={set('youtube')} className={inputClass} placeholder="https://youtube.com/…" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">LinkedIn</label>
              <input value={form.linkedin} onChange={set('linkedin')} className={inputClass} placeholder="https://linkedin.com/…" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
          <h3 className="font-bold">Payment Information</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Payout Network</label>
            <Select value={form.payoutMethod} onValueChange={(v) => setForm((f) => ({ ...f, payoutMethod: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                <SelectItem value="Ethereum">Ethereum</SelectItem>
                <SelectItem value="Tether">Tether (USDT)</SelectItem>
                <SelectItem value="Solana">Solana</SelectItem>
                <SelectItem value="BNB Chain">BNB Chain</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Payout Wallet Address</label>
            <input value={form.payoutWalletAddress} onChange={set('payoutWalletAddress')} className={inputClass} placeholder="0x... or wallet address" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
          <h3 className="font-bold">Digital Delivery Settings</h3>
          <p className="text-xs text-muted-foreground -mt-2">Every HStock product is delivered instantly after purchase, so there are no shipping costs or carrier settings to manage.</p>
          <div>
            <label className="block text-sm font-medium mb-1.5">Delivery Notes</label>
            <textarea value={form.shippingPolicy} onChange={set('shippingPolicy')} className={textareaClass} placeholder="Add any notes about access instructions, licensing, or download windows…" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Access Window</label>
            <input value={form.defaultProcessingTime} onChange={set('defaultProcessingTime')} className={inputClass} placeholder="e.g. Instant access after checkout" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
          <h3 className="font-bold">Notification Settings</h3>
          {NOTIFICATION_TOGGLES.map((n) => (
            <label key={n.key} className="flex items-start justify-between gap-3 cursor-pointer">
              <span>
                <span className="block text-sm font-medium">{n.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{n.hint}</span>
              </span>
              <Switch checked={form.notifications[n.key]} onCheckedChange={() => toggleNotification(n.key)} className="mt-0.5 shrink-0" />
            </label>
          ))}
        </div>

        <button type="submit" className="w-full px-5 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 transition-all">
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default SellerStoreSettingsTab;
