import React, { useState } from 'react';
import { Plus, LifeBuoy, ChevronDown } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { defaultTickets, faqItems, loadLS, saveLS, uid } from '../../services/buyerDashboard';
import { useCms } from '../../hooks/useCms';
import { CMS_KEYS } from '../../services/cmsApi';

const KEY = 'pm_support_tickets';

const statusStyle = { open: 'bg-blue-100 text-blue-700', resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-slate-200 text-slate-700' };

const CreateTicketModal = ({ open, onOpenChange, onSave }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');

  const submit = (e) => {
    e.preventDefault();
    onSave({
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject, priority, status: 'open', createdAt: new Date().toISOString(),
      messages: [{ from: 'buyer', text: message, date: new Date().toISOString() }],
    });
    setSubject(''); setMessage(''); setPriority('normal');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogDescription className="sr-only">Contact support about an order, license, or account issue.</DialogDescription>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary resize-none" />
          </div>
          <button type="submit" className="brand-gradient text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-95 transition-all w-full">Submit Ticket</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 py-3.5 text-left">
        <span className="text-sm font-semibold">{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-muted-foreground pb-3.5 leading-relaxed">{a}</p>}
    </div>
  );
};

const TicketCard = ({ t }) => (
  <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div>
        <p className="text-sm font-bold">{t.subject}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t.id} · {new Date(t.createdAt).toLocaleDateString()}</p>
      </div>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusStyle[t.status]}`}>{t.status}</span>
    </div>
    <div className="space-y-2">
      {t.messages.map((m, i) => (
        <div key={i} className={`text-sm rounded-2xl px-4 py-2.5 max-w-[85%] ${m.from === 'buyer' ? 'bg-secondary ml-auto' : 'bg-primary/10'}`}>
          {m.text}
        </div>
      ))}
    </div>
  </div>
);

const SupportPage = () => {
  const { toast } = useToast();
  const { data: contact } = useCms(CMS_KEYS.CONTACT);
  const supportEmail = contact?.email || '';
  const [tickets, setTickets] = useState(() => loadLS(KEY, null) || defaultTickets);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSave = (ticket) => {
    const next = [ticket, ...tickets];
    setTickets(next);
    saveLS(KEY, next);
    toast({ title: 'Ticket submitted', description: `${ticket.id} — our team will respond soon.` });
  };

  return (
    <>
      <Seo title="Support Center" description="Get help with orders, licenses, and your ApnaStore account." noIndex />
      <AccountLayout title="Support" subtitle="Get help with orders, downloads, and licensing.">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">My Tickets</h2>
              <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity">
                <Plus className="w-4 h-4" /> Create Ticket
              </button>
            </div>
            {tickets.length === 0 ? (
              <EmptyState title="No support tickets" message="Need help? Create a ticket and our team will get back to you." actionLabel="Create Ticket" actionTo="#" onSecondary={() => setModalOpen(true)} />
            ) : (
              <div className="space-y-4">{tickets.map((t) => <TicketCard key={t.id} t={t} />)}</div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-primary" /> FAQ</h3>
              {faqItems.map((f) => <FaqItem key={f.q} {...f} />)}
            </div>
            <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
              <h3 className="font-bold text-sm mb-1">Contact Support</h3>
              <p className="text-xs text-muted-foreground mb-3">Prefer email? Reach us directly and we'll follow up.</p>
              {supportEmail ? (
                <a href={`mailto:${supportEmail}`} className="text-sm font-semibold text-primary hover:underline">{supportEmail}</a>
              ) : (
                <p className="text-sm text-muted-foreground">Support email is managed in CMS Contact Settings.</p>
              )}
            </div>
          </div>
        </div>

        <CreateTicketModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSave} />
      </AccountLayout>
    </>
  );
};

export default SupportPage;
