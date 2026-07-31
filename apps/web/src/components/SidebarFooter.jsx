import React from 'react';
import { Link } from 'react-router-dom';

const SidebarFooter = ({ footerLinks, onNavigate }) => (
  <div className="border-t border-[#E5E7EB] bg-white px-4 py-4">
    <div className="space-y-3">
      {footerLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={`inline-flex w-full items-center justify-center rounded-full px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${link.primary
            ? 'bg-gradient-to-r from-primary to-accent text-white shadow-sm hover:opacity-95'
            : 'border border-[#E5E7EB] bg-white text-foreground hover:bg-slate-50'}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  </div>
);

export default SidebarFooter;
