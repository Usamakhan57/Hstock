import React from 'react';

/**
 * Category-page sidebar. Only "Jump to Category" remains (Hstock-style).
 * Extra marketplace filters were removed from this surface.
 */
const FilterSidebar = ({ categorySlot }) => {
  if (!categorySlot) return null;

  return (
    <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm lg:sticky lg:top-[9.5rem]">
      {categorySlot}
    </div>
  );
};

export default FilterSidebar;
