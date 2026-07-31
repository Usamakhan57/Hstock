import React, { useMemo, useState } from 'react';
import { Ticket, Copy, Check } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/use-toast';
import { defaultCoupons } from '../../services/buyerDashboard';

const TABS = ['Active', 'Expired', 'Used'];

const CouponsPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState('Active');
  const [applyCode, setApplyCode] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const filtered = useMemo(
    () => defaultCoupons.filter((c) => c.status === tab.toLowerCase()),
    [tab]
  );

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    toast({ title: 'Coupon code copied', description: code });
    setTimeout(() => setCopiedCode(''), 1500);
  };

  const applyCoupon = (e) => {
    e.preventDefault();
    const found = defaultCoupons.find((c) => c.code.toLowerCase() === applyCode.toLowerCase());
    if (found && found.status === 'active') {
      toast({ title: 'Coupon applied', description: `${found.code} — ${found.description}` });
    } else if (found) {
      toast({ title: 'Coupon unavailable', description: `${found.code} is ${found.status}.` });
    } else {
      toast({ title: 'Invalid coupon code', description: applyCode });
    }
    setApplyCode('');
  };

  return (
    <>
      <Seo title="My Coupons" description="View and apply your saved HStock coupons." noIndex />
      <AccountLayout title="Coupons" subtitle="Discounts available on your account, ready to apply at checkout.">
        <form onSubmit={applyCoupon} className="flex items-center gap-2 bg-white rounded-full px-2 py-2 border border-border mb-6 max-w-md">
          <input value={applyCode} onChange={(e) => setApplyCode(e.target.value)} placeholder="Enter coupon code" className="bg-transparent outline-none text-sm w-full px-3" />
          <button type="submit" className="shrink-0 px-5 py-2 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity">Apply</button>
        </form>

        <div className="flex items-center gap-1.5 mb-6">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === t ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}>{t}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={`No ${tab.toLowerCase()} coupons`} message="Check back later for new deals." actionLabel="Browse the Shop" actionTo="/shop" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <div key={c.code} className="bg-white rounded-3xl border border-dashed border-primary/40 soft-shadow p-5 relative overflow-hidden">
                <span className="w-10 h-10 rounded-xl bg-secondary grid place-items-center mb-3">
                  <Ticket className="w-5 h-5 text-primary" />
                </span>
                <p className="font-black text-lg tracking-wide">{c.code}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {c.status === 'expired' ? 'Expired' : c.status === 'used' ? 'Used on' : 'Expires'} {new Date(c.expiresAt).toLocaleDateString()}
                </p>
                {c.status === 'active' && (
                  <button onClick={() => copyCode(c.code)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-border hover:bg-secondary transition-colors">
                    {copiedCode === c.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copiedCode === c.code ? 'Copied' : 'Copy Code'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </AccountLayout>
    </>
  );
};

export default CouponsPage;
