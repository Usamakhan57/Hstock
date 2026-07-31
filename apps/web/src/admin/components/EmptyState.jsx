import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    {Icon && (
      <span className="w-14 h-14 rounded-2xl bg-primary/[0.08] grid place-items-center mb-4">
        <Icon className="w-6 h-6 text-primary/70" />
      </span>
    )}
    <p className="font-semibold text-foreground">{title}</p>
    {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
