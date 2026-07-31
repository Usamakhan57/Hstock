import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { defaultCryptoWallets, loadLS, saveLS, uid } from '../../services/buyerDashboard';

const KEY = 'pm_payment_methods';

const AddPaymentModal = ({ open, onOpenChange, onSave }) => {
  const [network, setNetwork] = useState('Bitcoin');
  const [address, setAddress] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    const wallet = { id: uid('pm'), network, address: address.trim(), isDefault: false };
    onSave(wallet);
    setAddress('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogTitle>Add Wallet Address</DialogTitle>
        <DialogDescription className="sr-only">This is a UI-only demo — no real wallet address data is stored.</DialogDescription>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">Network</label>
            <select value={network} onChange={(e) => setNetwork(e.target.value)} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary">
              <option value="Bitcoin">Bitcoin</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Tether">Tether (USDT)</option>
              <option value="Solana">Solana</option>
              <option value="BNB Chain">BNB Chain</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Wallet address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="0x... or wallet address" className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
          </div>
          <p className="text-xs text-muted-foreground">This is a frontend-only demo — saved wallet addresses are stored locally for mock transactions only.</p>
          <button type="submit" className="brand-gradient text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-95 transition-all w-full">Add Wallet Address</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PaymentMethodsPage = () => {
  const { toast } = useToast();
  const [methods, setMethods] = useState(() => loadLS(KEY, null) || defaultCryptoWallets);
  const [modalOpen, setModalOpen] = useState(false);

  const persist = (next) => { setMethods(next); saveLS(KEY, next); };

  const handleSave = (m) => {
    persist([...methods, m]);
    toast({ title: 'Payment method added' });
  };

  const handleDelete = (id) => {
    persist(methods.filter((m) => m.id !== id));
    toast({ title: 'Payment method removed' });
  };

  const makeDefault = (id) => {
    persist(methods.map((m) => ({ ...m, isDefault: m.id === id })));
    toast({ title: 'Default payment method updated' });
  };

  return (
    <>
      <Seo title="Crypto Wallets" description="Manage your saved crypto wallet addresses on ApnaStore." noIndex />
      <AccountLayout title="Crypto Wallets" subtitle="Crypto wallet addresses only — no fiat payment methods are supported.">
        <div className="flex justify-end mb-5">
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity">
            <Plus className="w-4 h-4" /> Add Wallet Address
          </button>
        </div>

        {methods.length === 0 ? (
          <EmptyState title="No crypto wallets saved" message="Add a wallet address to use for deposits and withdrawals." actionLabel="Add Wallet" actionTo="#" onSecondary={() => setModalOpen(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {methods.map((m) => (
              <div key={m.id} className="bg-white rounded-3xl border border-border soft-shadow p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-xl bg-secondary grid place-items-center shrink-0 text-primary font-semibold">
                      {m.network[0]}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{m.network}</p>
                      <p className="text-xs text-muted-foreground break-all">{m.address}</p>
                    </div>
                  </div>
                  {m.isDefault && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Default</span>}
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <button onClick={() => handleDelete(m.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                  {!m.isDefault && (
                    <button onClick={() => makeDefault(m.id)} className="text-xs font-semibold text-muted-foreground hover:text-foreground ml-auto">Make Default</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <AddPaymentModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSave} />
      </AccountLayout>
    </>
  );
};

export default PaymentMethodsPage;
