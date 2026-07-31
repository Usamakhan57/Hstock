import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useToast } from '../hooks/use-toast';

const REASONS = {
  product: ['Copyright infringement', 'Misleading description', 'Broken download / corrupt file', 'Inappropriate content', 'Other'],
  seller: ['Scam or fraud', 'Impersonation', 'Harassment', 'Selling counterfeit items', 'Other'],
};

/**
 * `subjectType` is 'product' or 'seller'; `subjectName` is shown in the
 * dialog copy. This is UI-only — submissions are surfaced via toast and
 * not persisted, ready to wire to a real moderation endpoint later.
 */
const ReportModal = ({ open, onOpenChange, subjectType = 'product', subjectName }) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const submit = (e) => {
    e.preventDefault();
    toast({ title: 'Report submitted', description: 'Thanks — our team will review this shortly.' });
    setReason('');
    setDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogTitle className="flex items-center gap-2"><Flag className="w-4 h-4 text-destructive" /> Report {subjectType === 'seller' ? 'Seller' : 'Product'}</DialogTitle>
        <DialogDescription>{subjectName ? `Reporting "${subjectName}"` : `Let us know what's wrong with this ${subjectType}.`}</DialogDescription>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary">
              <option value="" disabled>Select a reason</option>
              {REASONS[subjectType].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Additional details (optional)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary resize-none" />
          </div>
          <button type="submit" className="w-full px-6 py-2.5 rounded-full bg-destructive text-destructive-foreground font-semibold hover:opacity-90 transition-all">
            Submit Report
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
