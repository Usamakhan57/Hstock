import React from 'react';

const SidebarOverlay = ({ open, onClose }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Close seller sidebar"
    className={`fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top,0px))] z-[44] bg-black/35 transition-opacity duration-250 sm:inset-0 sm:top-0 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
  />
);

export default SidebarOverlay;
