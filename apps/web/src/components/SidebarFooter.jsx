import React from 'react';
import { Link } from 'react-router-dom';

const SidebarFooter = ({ footerLinks, onNavigate }) => (
  <div className="border-t border-[#E5E7EB] bg-white px-4 py-4">
    <div className="space-y-3">
      {footerLinks.map((link) => (
        link.disabled ? (
          <span
            key={`${link.label}-disabled`}
            title="Available after seller approval"
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-[#E5E7EB] bg-slate-50 px-4 py-3.5 text-sm font-semibold text-muted-foreground"
          >
            {link.label}
          </span>
        ) : (
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
        )
      ))}
    </div>
  </div>
);

export default SidebarFooter;
