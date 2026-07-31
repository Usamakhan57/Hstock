import React from 'react';
import { SlidersHorizontal, Star, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { PRICE_RANGES, RATING_FILTERS, FILE_TYPE_FILTERS, LICENSE_FILTERS, DEFAULT_FILTERS } from '../constants';

const Group = ({ title, children }) => (
  <fieldset className="mt-5 border-t border-border pt-5 first:mt-0 first:border-0 first:pt-0">
    <legend className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">{title}</legend>
    {children}
  </fieldset>
);

const Radio = ({ name, checked, onChange, children }) => (
  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm transition-colors hover:text-primary">
    <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-[#6C3BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    <span className={checked ? 'font-semibold text-foreground' : 'text-foreground/80'}>{children}</span>
  </label>
);

const Check = ({ checked, onChange, children }) => (
  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm transition-colors hover:text-primary">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-[#6C3BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    <span className={checked ? 'font-semibold text-foreground' : 'text-foreground/80'}>{children}</span>
  </label>
);

const FilterSidebar = ({ filters, onChange, categorySlot, resultCount }) => {
  const set = (patch) => onChange({ ...filters, ...patch });
  const toggleIn = (key, value) => set({ [key]: filters[key].includes(value) ? filters[key].filter((v) => v !== value) : [...filters[key], value] });

  const isDefault = filters.price === DEFAULT_FILTERS.price && filters.rating === DEFAULT_FILTERS.rating && filters.fileTypes.length === 0 && filters.licenses.length === 0 && !filters.verifiedOnly;

  return (
    <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm lg:sticky lg:top-[9.5rem]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /></span>
          Filters
          {typeof resultCount === 'number' && <span className="text-xs font-normal text-muted-foreground">· {resultCount} result{resultCount === 1 ? '' : 's'}</span>}
        </div>
        {!isDefault && <button type="button" onClick={() => set({ price: 'any', rating: 0, fileTypes: [], licenses: [], deliveryTime: 'any', verifiedOnly: false })} className="flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80"> <RotateCcw className="h-3 w-3" aria-hidden="true" /> Clear</button>}
      </div>

      <div className="mb-4 rounded-2xl border border-primary/10 bg-primary/[0.05] p-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground"><Sparkles className="h-4 w-4 text-primary" /> Curated marketplace filters</div>
        <p className="mt-1">Refine by format, access type, and seller trust.</p>
      </div>

      {categorySlot}

      <Group title="Price range">{PRICE_RANGES.map((r) => <Radio key={r.id} name="price" checked={filters.price === r.id} onChange={() => set({ price: r.id })}>{r.label}</Radio>)}</Group>
      <Group title="Rating">{RATING_FILTERS.map((r) => <Radio key={r.id} name="rating" checked={filters.rating === r.id} onChange={() => set({ rating: r.id })}><span className="inline-flex items-center gap-1">{r.id > 0 && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />}{r.label}</span></Radio>)}</Group>
      <Group title="Product type"><div className="grid grid-cols-2 gap-x-1">{FILE_TYPE_FILTERS.map((t) => <Check key={t} checked={filters.fileTypes.includes(t)} onChange={() => toggleIn('fileTypes', t)}>{t}</Check>)}</div></Group>
      <Group title="License">{LICENSE_FILTERS.map((l) => <Check key={l.id} checked={filters.licenses.includes(l.id)} onChange={() => toggleIn('licenses', l.id)}>{l.label}</Check>)}</Group>
      <Group title="Seller"><Check checked={!!filters.verifiedOnly} onChange={() => set({ verifiedOnly: !filters.verifiedOnly })}><span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified sellers only</span></Check></Group>
    </div>
  );
};

export default FilterSidebar;
