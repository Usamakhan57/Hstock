import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Package, ShieldCheck, Truck, CheckCircle2, AlertTriangle, Send, MessageCircle, Flag,
  CircleDot, Circle, Download, CreditCard,
} from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../hooks/use-toast';

const escrowStyle = {
  Held: 'bg-amber-100 text-amber-700',
  Released: 'bg-emerald-100 text-emerald-700',
  Disputed: 'bg-red-100 text-red-700',
};

const deliveryStyle = {
  'Awaiting Delivery': 'bg-amber-100 text-amber-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
};

const escrowProgress = {
  Held: 55,
  Released: 100,
  Disputed: 55,
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const { getOrder, sendOrderMessage, confirmReceipt, openDispute } = useStore();
  const { toast } = useToast();
  const order = getOrder(id);
  const [message, setMessage] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  if (!order) {
    return (
      <AccountLayout title="Order Not Found">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-6">We couldn't find that order.</p>
          <Link to="/orders" className="px-6 py-3 rounded-full brand-gradient text-white font-semibold">Back to Orders</Link>
        </div>
      </AccountLayout>
    );
  }

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendOrderMessage(order.id, message);
    setMessage('');
  };

  const handleConfirmReceipt = () => {
    confirmReceipt(order.id);
    toast({ title: 'Delivery confirmed', description: 'Escrow released to the seller. Order marked as completed.' });
  };

  const handleSubmitDispute = () => {
    openDispute(order.id, disputeReason);
    setDisputeOpen(false);
    setDisputeReason('');
    toast({ title: 'Dispute opened', description: 'HStock support will review this order.' });
  };

  const handleDownload = () => {
    toast({ title: 'Download started', description: `${order.product.title} — this is a demo, no file is actually sent.` });
  };

  const isDelivered = order.deliveryStatus === 'Delivered';
  const isReleased = order.escrowStatus === 'Released';
  const isDigital = order.product.productType !== 'physical';

  // Order Timeline — steps derived purely from the order's own status fields,
  // no extra state. Payment is always confirmed at this point because an
  // order only exists after the wallet debit succeeded (confirmPurchase).
  const timeline = [
    { label: 'Order Placed', done: true, date: order.date },
    { label: 'Payment Confirmed', done: true, date: order.date },
    { label: 'Seller Preparing Delivery', done: isDelivered || isReleased, date: null },
    { label: 'Delivered', done: isDelivered || isReleased, date: null },
    { label: 'Escrow Released', done: isReleased, date: null },
  ];

  return (
    <>
      <Seo title={`Order ${order.id}`} description="View your HStock order details, access status, and escrow." noIndex />
      <AccountLayout title={`Order ${order.id}`} subtitle={new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Product summary */}
            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <div className="flex items-center gap-4">
                <Link to={`/product/${order.product.id}`} className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary shrink-0">
                  <img src={order.product.img} alt={order.product.title} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${order.product.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">{order.product.title}</Link>
                  <p className="text-xs text-muted-foreground mt-0.5">by {order.product.artist}{order.licenseName ? ` · ${order.licenseName}` : ''}</p>
                </div>
                <span className="font-black text-lg shrink-0">${order.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <h2 className="font-bold mb-5">Order Timeline</h2>
              <ol className="space-y-0">
                {timeline.map((step, i) => (
                  <li key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : order.disputeOpen ? (
                        <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                      ) : (
                        <CircleDot className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      {i < timeline.length - 1 && (
                        <span className={`w-px flex-1 min-h-[1.5rem] ${step.done ? 'bg-primary' : 'bg-border'}`} />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className={`text-sm font-semibold ${step.done ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                      {step.date && <p className="text-xs text-muted-foreground">{new Date(step.date).toLocaleString()}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Status */}
            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <h2 className="font-bold mb-4">Order Status</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
                  <CreditCard className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Status</p>
                    <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Paid</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
                  <Truck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Access Status</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${deliveryStyle[order.deliveryStatus] || 'bg-secondary'}`}>{order.deliveryStatus}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Escrow Status</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${escrowStyle[order.escrowStatus] || 'bg-secondary'}`}>{order.escrowStatus}</span>
                  </div>
                </div>
              </div>

              {/* Escrow progress bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Escrow Progress</span>
                  <span>{escrowProgress[order.escrowStatus] ?? 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${order.escrowStatus === 'Disputed' ? 'bg-destructive' : 'brand-gradient'}`}
                    style={{ width: `${escrowProgress[order.escrowStatus] ?? 0}%` }}
                  />
                </div>
              </div>

              {order.escrowStatus === 'Held' && !order.disputeOpen && (
                <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-border">
                  <button
                    onClick={handleConfirmReceipt}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 transition-opacity"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm Access &amp; Release Escrow
                  </button>
                  <button
                    onClick={() => setDisputeOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors"
                  >
                    <Flag className="w-4 h-4" /> Open Dispute
                  </button>
                </div>
              )}
              {order.disputeOpen && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive mt-5 pt-5 border-t border-border">
                  <AlertTriangle className="w-4 h-4" /> Dispute open — HStock support is reviewing this order.
                </p>
              )}
              {order.escrowStatus === 'Released' && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 mt-5 pt-5 border-t border-border">
                  <CheckCircle2 className="w-4 h-4" /> Order completed — escrow released after access confirmation.
                </p>
              )}

              {disputeOpen && (
                <div className="mt-5 pt-5 border-t border-border">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Describe the issue</label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Access details haven't been handed over yet…"
                    className="w-full text-sm bg-secondary/50 rounded-2xl px-4 py-3 outline-none border border-transparent focus:border-primary transition-colors"
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={handleSubmitDispute} className="px-5 py-2 rounded-full brand-gradient text-white text-sm font-semibold">Submit Dispute</button>
                    <button onClick={() => setDisputeOpen(false)} className="px-5 py-2 rounded-full border border-border text-sm font-semibold hover:bg-secondary">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Download area — digital products only, once delivered */}
            {isDigital && (isDelivered || isReleased) && (
              <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
                <h2 className="font-bold flex items-center gap-2 mb-4"><Download className="w-4 h-4 text-primary" /> Download Area</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0">
                    <img src={order.product.img} alt={order.product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{order.product.title}</p>
                    <p className="text-xs text-muted-foreground">{order.licenseName || 'Personal Use'} license</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full brand-gradient text-white text-xs font-semibold hover:opacity-95 transition-opacity shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <h2 className="font-bold flex items-center gap-2 mb-4"><MessageCircle className="w-4 h-4 text-primary" /> Buyer–Seller Chat</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {order.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.from === 'buyer' ? 'brand-gradient text-white' : m.from === 'system' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-secondary text-foreground'
                    }`}>
                      <p>{m.text}</p>
                      <p className={`text-[10px] mt-1 ${m.from === 'buyer' ? 'text-white/70' : 'text-muted-foreground'}`}>{new Date(m.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message the seller…"
                  className="flex-1 text-sm bg-secondary/50 rounded-full px-4 py-2.5 outline-none border border-transparent focus:border-primary transition-colors"
                />
                <button type="submit" aria-label="Send message" className="w-10 h-10 grid place-items-center rounded-full brand-gradient text-white shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
              <h2 className="font-bold flex items-center gap-2 mb-4"><Package className="w-4 h-4 text-primary" /> Payment Summary</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Order ID</dt><dd className="font-semibold">{order.id}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Amount Paid</dt><dd className="font-semibold">${order.amount.toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Wallet Balance After</dt><dd className="font-semibold">${order.walletBalanceAfter.toFixed(2)}</dd></div>
                <div className="flex justify-between pt-2.5 border-t border-border"><dt className="text-muted-foreground">Status</dt><dd className="font-semibold">{order.status}</dd></div>
              </dl>
            </div>
            <Link to="/orders" className="block text-center text-sm font-semibold px-5 py-3 rounded-full border border-border hover:bg-secondary transition-colors">
              Back to Order History
            </Link>
          </div>
        </div>
      </AccountLayout>
    </>
  );
};

export default OrderDetailPage;
