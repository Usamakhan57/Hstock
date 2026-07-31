import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../components/ui/collapsible';
import { adminNavSections } from './nav';
import { LOGO } from '../../data';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'brand-gradient text-white' : 'text-foreground/75 hover:bg-secondary hover:text-foreground'
  }`;

/** Nav item with a `children` array — collapsible group, auto-expanded when a child route is active. */
const NavGroup = ({ item, onNavigate }) => {
  const location = useLocation();
  const isChildActive = item.children.some((c) => location.pathname === c.to || (!c.end && location.pathname.startsWith(c.to + '/')));
  const [open, setOpen] = useState(isChildActive);

  return (
    <Collapsible open={open || isChildActive} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            isChildActive ? 'text-foreground bg-secondary' : 'text-foreground/75 hover:bg-secondary hover:text-foreground'
          }`}
        >
          <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${(open || isChildActive) ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
        {item.children.map((child) => (
          <NavLink key={child.to} to={child.to} end={child.end} onClick={onNavigate} className={navLinkClass}>
            <child.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            {child.label}
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

const NavItems = ({ onNavigate }) => (
  <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
    {adminNavSections.map((section, i) => (
      <div key={section.label || i}>
        {section.label && (
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</p>
        )}
        <div className="space-y-0.5">
          {section.items.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} onNavigate={onNavigate} />
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={navLinkClass}>
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          )}
        </div>
      </div>
    ))}
  </nav>
);

export const AdminSidebarContent = ({ onNavigate }) => (
  <div className="flex flex-col h-full bg-white">
    <div className="flex items-center gap-2 px-5 h-16 border-b border-border shrink-0">
      <img src={LOGO} alt="ApnaStore" className="h-8 w-auto" />
      <span className="text-xs font-semibold text-muted-foreground">Admin</span>
    </div>
    <NavItems onNavigate={onNavigate} />
  </div>
);

const AdminSidebar = () => (
  <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-border sticky top-[108px] h-[calc(100vh-108px)]">
    <AdminSidebarContent />
  </aside>
);

export default AdminSidebar;
