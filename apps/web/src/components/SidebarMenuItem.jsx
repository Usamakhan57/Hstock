import React from 'react';
import { Link } from 'react-router-dom';

const SidebarMenuItem = ({ item, active, onNavigate }) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-[1.2rem] border px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${active
        ? 'border-transparent bg-gradient-to-r from-primary to-accent text-white shadow-sm'
        : 'border-[#E5E7EB] bg-white text-foreground hover:bg-slate-50 hover:-translate-y-0.5'}`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>{item.label}</span>
    </Link>
  );
};

export default SidebarMenuItem;
