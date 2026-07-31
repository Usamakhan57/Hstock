import React, { useState } from 'react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import { useToast } from '../../hooks/use-toast';

const Toggle = ({ checked, onChange, label, description }) => (
  <label className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-0 cursor-pointer">
    <span>
      <span className="text-sm font-semibold block">{label}</span>
      {description && <span className="text-xs text-muted-foreground">{description}</span>}
    </span>
    <span className="relative inline-flex items-center shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <span className="w-10 h-6 rounded-full bg-border peer-checked:bg-primary transition-colors" />
      <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
    </span>
  </label>
);

const SettingsPage = () => {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ marketing: true, orderUpdates: true, newArrivals: false });

  const save = (e) => {
    e.preventDefault();
    toast({ title: 'Settings saved', description: 'Your notification preferences were updated.' });
  };

  return (
    <>
      <Seo title="Account Settings" description="Manage your HStock notification and account preferences." noIndex />
      <AccountLayout title="Settings" subtitle="Control how HStock communicates with you.">
        <form onSubmit={save} className="bg-white rounded-3xl border border-border soft-shadow p-6 max-w-lg">
          <h3 className="font-bold text-sm mb-1">Notifications</h3>
          <Toggle
            checked={prefs.orderUpdates}
            onChange={(e) => setPrefs({ ...prefs, orderUpdates: e.target.checked })}
            label="Order updates"
            description="Receipts, download links, and order status changes."
          />
          <Toggle
            checked={prefs.newArrivals}
            onChange={(e) => setPrefs({ ...prefs, newArrivals: e.target.checked })}
            label="New arrivals"
            description="Get notified about new products in categories you follow."
          />
          <Toggle
            checked={prefs.marketing}
            onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
            label="Marketing emails"
            description="Occasional deals, promotions, and creator spotlights."
          />
          <button type="submit" className="mt-6 brand-gradient text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-95 transition-all">
            Save preferences
          </button>
        </form>
      </AccountLayout>
    </>
  );
};

export default SettingsPage;
