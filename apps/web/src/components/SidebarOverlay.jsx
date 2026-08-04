import React from 'react';

/**
 * Dims marketplace content while Seller Workspace is open.
 * Starts below the sticky header so the dropdown feels header-anchored.
 */
const SidebarOverlay = ({ open, onClose }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Close seller sidebar"
    data-testid="seller-drawer-overlay"
    className={`fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top,0px))] z-[100] bg-black/40 transition-opacity duration-200 ease-out ${
      open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}
  />
);

export default SidebarOverlay;
