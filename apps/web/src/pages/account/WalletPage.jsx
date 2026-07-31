import React, { useMemo, useState } from 'react';
import { Wallet, PlusCircle, MinusCircle, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Clock3 } from 'lucide-react';
import { SiBitcoin, SiEthereum, SiTether, SiSolana, SiBinance } from 'react-icons/si';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../hooks/use-toast';

const QUICK_AMOUNTS = [25, 50, 100, 250];
const HISTORY_TABS = ['All', 'Deposits', 'Withdrawals'];

const CRYPTO_NETWORKS = [
  { id: 'BTC', label: 'Bitcoin', symbol: 'BTC', icon: SiBitcoin, address: 'bc1qs7lp7qze...9saj', color: 'text-amber-500' },
  { id: 'ETH', label: 'Ethereum', symbol: 'ETH', icon: SiEthereum, address: '0xF7e4...21B5', color: 'text-slate-900' },
  { id: 'USDT', label: 'Tether', symbol: 'USDT', icon: SiTether, address: '0xD4f8...4a27', color: 'text-cyan-600' },
  { id: 'SOL', label: 'Solana', symbol: 'SOL', icon: SiSolana, address: '8s7kLmP3F1...xYhJ', color: 'text-violet-600' },
  { id: 'BNB', label: 'BNB Chain', symbol: 'BNB', icon: SiBinance, address: 'bnb1xm4n2g...8k5w', color: 'text-yellow-500' },
];

const WalletPage = () => {
  const { wallet, transactions, orders, deposit, withdraw } = useStore();
  const { toast } = useToast();
  const [mode, setMode] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BTC');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [historyTab, setHistoryTab] = useState('All');

  const selectedNetwork = useMemo(
    () => CRYPTO_NETWORKS.find((network) => network.id === method) || CRYPTO_NETWORKS[0],
    [method]
  );
  const SelectedNetworkIcon = selectedNetwork.icon;

  const escrowBalance = useMemo(
    () => orders.filter((o) => o.escrowStatus === 'Held' || o.escrowStatus === 'Disputed').reduce((s, o) => s + o.amount, 0),
    [orders]
  );
  // No real clearing delay is modeled in this demo — deposits complete
  // instantly — so pending balance always reads $0. Kept as its own stat so
  // the layout matches HStock's balance breakdown and is ready to wire up
  // once a real payment processor with clearing times is connected.
  const pendingBalance = 0;
  const currentBalance = wallet + escrowBalance + pendingBalance;

  const filteredHistory = useMemo(() => {
    if (historyTab === 'Deposits') return transactions.filter((t) => t.type === 'deposit');
    if (historyTab === 'Withdrawals') return transactions.filter((t) => t.type === 'withdrawal');
    return transactions;
  }, [transactions, historyTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    if (mode === 'deposit') {
      deposit(value, selectedNetwork.label);
      toast({ title: 'Deposit queued', description: `$${value.toFixed(2)} added via ${selectedNetwork.label}.` });
    } else {
      if (!withdrawAddress.trim()) {
        toast({ title: 'Enter a wallet address', variant: 'destructive' });
        return;
      }
      const result = withdraw(value, `${selectedNetwork.label} • ${withdrawAddress}`);
      if (!result?.success) {
        toast({ title: 'Withdrawal failed', description: 'Amount exceeds your available balance.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Withdrawal requested', description: `$${value.toFixed(2)} will be sent to your ${selectedNetwork.label} wallet.` });
      setWithdrawAddress('');
    }
    setAmount('');
  };

  return (
    <>
      <Seo title="Wallet" description="Manage your HStock crypto wallet balance, deposits, withdrawals, and transaction history." noIndex />
      <AccountLayout title="Wallet" subtitle="Crypto-only wallet balance for instant HStock purchases with modern network deposit and withdrawal flows.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl brand-gradient text-white mb-3"><Wallet className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-black tracking-tight mt-1">${currentBalance.toFixed(2)}</p>
          </div>
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mb-3"><Wallet className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-black tracking-tight mt-1 text-primary">${wallet.toFixed(2)}</p>
          </div>
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber-100 text-amber-700 mb-3"><ShieldCheck className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Escrow Balance</p>
            <p className="text-2xl font-black tracking-tight mt-1 text-amber-600">${escrowBalance.toFixed(2)}</p>
          </div>
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-secondary text-muted-foreground mb-3"><Clock3 className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Pending Balance</p>
            <p className="text-2xl font-black tracking-tight mt-1 text-muted-foreground">${pendingBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
            <span className="w-12 h-12 rounded-2xl brand-gradient text-white grid place-items-center shrink-0 mb-4">
              <Wallet className="w-6 h-6" />
            </span>
            <h3 className="font-bold text-sm mb-1">Balance Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-4">Escrow-protected — released to sellers only after you confirm delivery on each order.</p>
            {currentBalance > 0 && (
              <>
                <div className="h-3 rounded-full overflow-hidden flex bg-secondary">
                  <div className="brand-gradient h-full" style={{ width: `${(wallet / currentBalance) * 100}%` }} title="Available" />
                  <div className="bg-amber-400 h-full" style={{ width: `${(escrowBalance / currentBalance) * 100}%` }} title="Escrow" />
                  <div className="bg-muted-foreground/30 h-full" style={{ width: `${(pendingBalance / currentBalance) * 100}%` }} title="Pending" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full brand-gradient" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Escrow</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Pending</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="grid place-items-center w-12 h-12 rounded-2xl bg-secondary text-foreground">
                  <SelectedNetworkIcon className="w-6 h-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{selectedNetwork.label} Deposit Address</p>
                  <p className="text-xs text-muted-foreground">Send funds to this address to top up your HStock wallet.</p>
                </div>
              </div>
              <div className="rounded-3xl bg-secondary/70 p-4 border border-border flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{selectedNetwork.symbol} Address</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedNetwork.address);
                      toast({ title: 'Address copied', description: `${selectedNetwork.symbol} address copied to clipboard.` });
                    }}
                    className="text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    Copy
                  </button>
                </div>
                <p className="font-mono text-sm break-all">{selectedNetwork.address}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">This address is demo-only. Actual blockchain deposits are simulated in your wallet balance.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-border soft-shadow p-6">
              <div className="flex items-center gap-1.5 mb-4 bg-secondary/60 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setMode('deposit')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'deposit' ? 'brand-gradient text-white' : 'text-foreground/70 hover:bg-white'}`}
                >
                  <PlusCircle className="w-4 h-4" /> Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setMode('withdraw')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'withdraw' ? 'brand-gradient text-white' : 'text-foreground/70 hover:bg-white'}`}
                >
                  <MinusCircle className="w-4 h-4" /> Withdraw
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${amount === String(a) ? 'brand-gradient text-white' : 'bg-secondary hover:bg-secondary/70'}`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5" htmlFor="wallet-amount">Amount (USD)</label>
              <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors mb-4">
                <span className="text-muted-foreground text-sm">$</span>
                <input
                  id="wallet-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Select Network</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CRYPTO_NETWORKS.map((network) => {
                  const Icon = network.icon;
                  return (
                    <button
                      type="button"
                      key={network.id}
                      onClick={() => setMethod(network.id)}
                      className={`group flex items-center gap-3 px-3.5 py-3 rounded-3xl text-left text-sm font-semibold border transition-colors ${method === network.id ? 'border-primary bg-primary/[0.08] text-primary' : 'border-border bg-white hover:bg-secondary'}`}
                    >
                      <span className={`grid place-items-center w-10 h-10 rounded-2xl bg-muted-foreground/10 ${network.color}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span>{network.label}</span>
                    </button>
                  );
                })}
              </div>
              {mode === 'withdraw' && (
                <>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5" htmlFor="withdraw-address">Destination Wallet Address</label>
                  <input
                    id="withdraw-address"
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x... or wallet address"
                    className="w-full bg-secondary/60 rounded-2xl px-4 py-3 text-sm outline-none border border-transparent focus:border-primary transition-colors mb-5"
                  />
                </>
              )}
              <button type="submit" className="w-full px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:opacity-95 transition-opacity">
                {mode === 'deposit' ? 'Top Up Wallet' : 'Request Withdrawal'}
              </button>
              <p className="text-[11px] text-muted-foreground mt-2.5">Demo only — this updates your mock balance and simulates crypto on-chain flow.</p>
            </form>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="font-bold">Transaction History</h2>
            <div className="flex items-center gap-1.5">
              {HISTORY_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setHistoryTab(t)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${historyTab === t ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {filteredHistory.length === 0 ? (
            <EmptyState title="No transactions yet" message="Deposits, withdrawals, and purchases will show up here." />
          ) : (
            <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border">
              {filteredHistory.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${t.amount >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-foreground'}`}>
                    {t.amount >= 0 ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {t.type === 'deposit' && `Deposit via ${t.method}`}
                      {t.type === 'withdrawal' && `Withdrawal to ${t.method}`}
                      {t.type === 'purchase' && `Purchase — ${t.orderId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${t.amount >= 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                    {t.amount >= 0 ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </AccountLayout>
    </>
  );
};

export default WalletPage;
