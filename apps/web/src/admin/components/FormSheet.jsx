import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../../components/ui/sheet';

const FormSheet = ({ open, onOpenChange, title, description, onSubmit, submitting, submitLabel, children }) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="mt-6 space-y-5 pb-6"
      >
        {children}
        <SheetFooter className="pt-4 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-full text-sm font-semibold brand-gradient text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : (submitLabel || 'Save')}
          </button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
);

export const Field = ({ label, error, children, hint }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

export const inputClass = 'w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white';
export const textareaClass = `${inputClass} min-h-[90px] resize-y`;

export default FormSheet;
