import React from 'react';

/**
 * Simple underline-style tab bar for long forms (the product editor).
 * `tabs` is a string[]; `active` is the current tab; `onChange` receives
 * the newly selected tab. Purely presentational — each tab's content is
 * rendered by the parent, keyed off `active`.
 */
const FormTabs = ({ tabs, active, onChange }) => (
  <div className="flex items-center gap-1 overflow-x-auto border-b border-border mb-6 -mt-1">
    {tabs.map((t) => (
      <button
        key={t}
        type="button"
        onClick={() => onChange(t)}
        className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
          active === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

export default FormTabs;
