import React from 'react';

const SidebarOverlay = ({ open, onClose }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Close seller sidebar"
    className={`fixed inset-0 z-[60] bg-black/35 transition-opacity duration-250 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
  />
);

export default SidebarOverlay;
