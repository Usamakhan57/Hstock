/**
 * Build searchable hierarchical category options for seller product forms.
 * Pure helper — no I/O.
 */
import {
  SERVICE_SECTION_ORDER,
  displayServiceName,
  matchServiceSection,
} from './servicesCatalog';

function sortByName(a, b) {
  return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' });
}

function sectionHeading(category) {
  return matchServiceSection(category)?.heading || category?.name || 'Services';
}

function sectionOrder(category) {
  const hit = matchServiceSection(category);
  if (!hit) return SERVICE_SECTION_ORDER.length + 1;
  const index = SERVICE_SECTION_ORDER.findIndex((section) => section.key === hit.key);
  return index >= 0 ? index : SERVICE_SECTION_ORDER.length + 1;
}

/**
 * @param {Array<{ id: string, name?: string, slug?: string, children?: any[] }>} tree
 * @returns {Array<{ id: string, name: string, label: string, searchText: string, depth: number, group: string, selectable: boolean }>}
 */
export function buildCategorySelectOptions(tree = []) {
  const roots = Array.isArray(tree)
    ? [...tree].sort((a, b) => sectionOrder(a) - sectionOrder(b) || sortByName(a, b))
    : [];
  const options = [];

  roots.forEach((root) => {
    if (!root?.id) return;
    const group = sectionHeading(root);
    const children = Array.isArray(root.children) ? [...root.children].sort(sortByName) : [];

    // Always include the parent/root so every categoryId can be selected.
    options.push({
      id: String(root.id),
      name: root.name || group,
      label: group,
      searchText: `${group} ${root.name || ''} ${root.slug || ''}`.toLowerCase(),
      depth: 0,
      group,
      selectable: true,
      isParent: true,
    });

    children.forEach((child) => {
      if (!child?.id) return;
      const label = displayServiceName(child.name) || child.name;
      options.push({
        id: String(child.id),
        name: child.name || label,
        label,
        searchText: `${group} ${label} ${child.name || ''} ${child.slug || ''}`.toLowerCase(),
        depth: 1,
        group,
        selectable: true,
        parentId: String(root.id),
      });
    });
  });

  return options;
}

/** Resolve a display label for a selected category id from a flat category list. */
export function resolveCategorySelectLabel(categories = [], categoryId, fallback = '') {
  if (!categoryId) return fallback;
  const match = (categories || []).find((c) => String(c.id) === String(categoryId));
  if (!match) return fallback;
  return displayServiceName(match.name) || matchServiceSection(match)?.heading || match.name || fallback;
}

export default { buildCategorySelectOptions, resolveCategorySelectLabel };
