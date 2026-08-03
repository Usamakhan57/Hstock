import React from 'react';

/**
 * Overlay sits under the marketplace header on mobile (header stays visible),
 * and covers the full viewport on desktop so the seller panel can stack above the header.
 */
const SidebarOverlay = ({ open, onClose }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Close seller sidebar"
    data-testid="seller-drawer-overlay"
    className={`fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top,0px))] z-[100] bg-black/35 transition-opacity duration-300 sm:inset-0 sm:top-0 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
  />
);

export default SidebarOverlay;
