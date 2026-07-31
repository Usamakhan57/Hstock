import React from 'react';
import SidebarMenuItem from './SidebarMenuItem';

const SidebarNavigation = ({ items, activePath, onNavigate }) => (
  <div className="space-y-2.5">
    {items.map((item) => (
      <SidebarMenuItem key={item.to} item={item} active={activePath === item.to} onNavigate={onNavigate} />
    ))}
  </div>
);

export default SidebarNavigation;
