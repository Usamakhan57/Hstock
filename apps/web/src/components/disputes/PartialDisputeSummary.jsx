import React from 'react';
import { ShieldCheck } from 'lucide-react';

const PartialDisputeSummary = ({
  orderQuantity = 0,
  disputedQuantity = 0,
  remainingQuantity = 0,
  disputedAmount = 0,
  heldAmount = 0,
  undisputedAmount = 0,
  isPartial = false,
}) => (
  <div className="rounded-2xl border border-border bg-secondary/40 p-4">
    <div className="mb-3 flex items-center gap-2">
      <ShieldCheck className="h-4 w-4 text-primary" />
      <p className="text-sm font-bold">{isPartial ? 'Partial dispute' : 'Full order dispute'}</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Disputed qty</p>
        <p className="mt-1 text-sm font-semibold">{disputedQuantity} / {orderQuantity}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Remaining qty</p>
        <p className="mt-1 text-sm font-semibold">{remainingQuantity}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Escrow impact</p>
        <p className="mt-1 text-sm font-semibold">
          ${Number(heldAmount || disputedAmount || 0).toFixed(2)} held
        </p>
        {isPartial && (
          <p className="text-[11px] text-muted-foreground">
            ${Number(undisputedAmount || 0).toFixed(2)} undisputed continues release path
          </p>
        )}
      </div>
    </div>
  </div>
);

export default PartialDisputeSummary;
