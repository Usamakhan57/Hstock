import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import ImageUploadInput from '../../../admin/components/ImageUploadInput';
import { inputClass, textareaClass } from '../../../admin/components/FormSheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { useToast } from '../../../hooks/use-toast';
import { usersApi } from '../../../services/usersApi';

const NOTIFICATION_TOGGLES = [
  { key: 'newOrders', label: 'New order emails', hint: 'Get notified whenever a customer buys one of your products.' },
  { key: 'newReviews', label: 'New review alerts', hint: 'Get notified when a buyer leaves a review.' },
  { key: 'payouts', label: 'Payout updates', hint: 'Get notified when a withdrawal is processed.' },
  { key: 'marketing', label: 'HStock news & tips', hint: 'Occasional seller tips and platform updates.' },
];

const SellerStoreSettingsTab = ({ seller }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    logo: seller?.logo || '',
    banner: seller?.banner || '',
    storeName: seller?.storeName || '',
    description: seller?.bio || '',
    email: seller?.email || '',
    phone: seller?.phone || '',
    website: seller?.website || '',
    facebook: seller?.social?.facebook || '',
    instagram: seller?.social?.instagram || '',
    twitter: seller?.social?.twitter || '',
    youtube: seller?.social?.youtube || '',
    linkedin: seller?.social?.linkedin || '',
    address: seller?.address || '',
    payoutMethod: seller?.payout?.asset || 'USDT',
    payoutWalletAddress: seller?.payout?.walletAddress || '',
    notifications: {
      newOrders: seller?.notifications?.newOrders ?? true,
      newReviews: seller?.notifications?.newReviews ?? true,
      payouts: seller?.notifications?.payouts ?? true,
      marketing: seller?.notifications?.marketing ?? false,
    },
    shippingPolicy: seller?.shippingPolicy || '',
    defaultProcessingTime: seller?.defaultProcessingTime || 'Instant access after checkout',
    defaultShippingCost: '0',
    freeShippingEnabled: true,
    freeShippingThreshold: '',
    countriesServed: 'Worldwide',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleNotification = (key) => setForm((f) => ({ ...f, notifications: { ...f.notifications, [key]: !f.notifications[key] } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        storeName: form.storeName.trim() || undefined,
        bio: form.description,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        address: form.address.trim() || null,
        social: {
          facebook: form.facebook.trim() || null,
          instagram: form.instagram.trim() || null,
          twitter: form.twitter.trim() || null,
          youtube: form.youtube.trim() || null,
          linkedin: form.linkedin.trim() || null,
        },
        payout: {
          asset: form.payoutMethod || null,
          walletAddress: form.payoutWalletAddress.trim() || null,
        },
        shippingPolicy: form.shippingPolicy || null,
        defaultProcessingTime: form.defaultProcessingTime || null,
        notifications: form.notifications,
      };
      if (form.logo && (form.logo.startsWith('http') || form.logo.startsWith('data:'))) payload.logo = form.logo;
      if (form.banner && (form.banner.startsWith('http') || form.banner.startsWith('data:'))) payload.banner = form.banner;
      await usersApi.updateSellerProfile(payload);
      toast({ title: 'Store settings saved', description: 'Your storefront settings were updated.' });
    } catch (err) {
      toast({ title: 'Could not save settings', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
                <SelectItem value="BTC">Bitcoin</SelectItem>
                <SelectItem value="ETH">Ethereum</SelectItem>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                <SelectItem value="SOL">Solana</SelectItem>
                <SelectItem value="BNB">BNB Chain</SelectItem>
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

        <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default SellerStoreSettingsTab;
