import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import EmptyState from '../../../admin/components/EmptyState';
import { useStore } from '../../../context/StoreContext';

/**
 * Reads the real buyer orders from StoreContext (not the seller mock data
 * set) so a seller can see and reply to the actual buyer-seller chat
 * threads started from a buyer's Order Details page. Filtered to orders
 * whose product belongs to this seller's store.
 */
const SellerMessagesTab = ({ storeName }) => {
  const { orders, sendOrderMessage } = useStore();
  const [drafts, setDrafts] = useState({});
  const [activeId, setActiveId] = useState(null);

  const sellerOrders = useMemo(
    () => orders.filter((o) => o.product.artist === storeName),
    [orders, storeName]
  );

  const activeOrder = sellerOrders.find((o) => o.id === activeId) || sellerOrders[0] || null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    const text = drafts[activeOrder.id];
    if (!text || !text.trim()) return;
    sendOrderMessage(activeOrder.id, text, 'seller');
    setDrafts((prev) => ({ ...prev, [activeOrder.id]: '' }));
  };

  if (sellerOrders.length === 0) {
    return <EmptyState icon={MessageCircle} title="No messages yet" description="Buyer messages about your orders will show up here." />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden lg:col-span-1">
        <h3 className="font-bold p-5 pb-3">Conversations</h3>
        <ul className="divide-y divide-border max-h-[32rem] overflow-y-auto">
          {sellerOrders.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => setActiveId(o.id)}
                className={`w-full text-left flex items-center gap-3 px-5 py-3.5 transition-colors ${activeOrder?.id === o.id ? 'bg-secondary/60' : 'hover:bg-secondary/30'}`}
              >
                <img src={o.product.img} alt="" className="w-9 h-9 rounded-lg object-cover bg-secondary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{o.product.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.messages[o.messages.length - 1]?.text || 'No messages yet'}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow p-5 lg:col-span-2 flex flex-col">
        {activeOrder ? (
          <>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div>
                <p className="font-semibold text-sm">{activeOrder.product.title}</p>
                <p className="text-xs text-muted-foreground">Order {activeOrder.id}</p>
              </div>
              <Link to={`/product/${activeOrder.product.id}`} className="text-xs font-semibold text-primary hover:underline">View Listing</Link>
            </div>
            <div className="space-y-3 flex-1 max-h-80 overflow-y-auto pr-1">
              {activeOrder.messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'seller' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === 'seller' ? 'brand-gradient text-white' : m.from === 'system' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-secondary text-foreground'
                  }`}>
                    <p>{m.text}</p>
                    <p className={`text-[10px] mt-1 ${m.from === 'seller' ? 'text-white/70' : 'text-muted-foreground'}`}>{new Date(m.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <input
                value={drafts[activeOrder.id] || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [activeOrder.id]: e.target.value }))}
                placeholder="Reply to buyer…"
                className="flex-1 text-sm bg-secondary/50 rounded-full px-4 py-2.5 outline-none border border-transparent focus:border-primary transition-colors"
              />
              <button type="submit" aria-label="Send reply" className="w-10 h-10 grid place-items-center rounded-full brand-gradient text-white shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a conversation to view messages.</p>
        )}
      </div>
    </div>
  );
};

export default SellerMessagesTab;
