import { describe, expect, it } from 'vitest';
import { buildCategorySelectOptions, resolveCategorySelectLabel } from './categorySelectOptions';

describe('buildCategorySelectOptions', () => {
  it('lists children under parent groups and leaf roots as selectable', () => {
    const options = buildCategorySelectOptions([
      {
        id: 'social',
        name: 'Social Accounts',
        slug: 'social-accounts',
        children: [
          { id: 'ig', name: 'Instagram Accounts', slug: 'instagram-accounts', children: [] },
          { id: 'fb', name: 'Facebook Accounts', slug: 'facebook-accounts', children: [] },
        ],
      },
      {
        id: 'vpn',
        name: 'VPN',
        slug: 'vpn',
        children: [],
      },
    ]);

    expect(options.map((o) => o.label)).toEqual(['Social Media', 'Facebook', 'Instagram', 'VPN']);
    expect(options.find((o) => o.id === 'ig')).toMatchObject({
      depth: 1,
      group: 'Social Media',
      parentId: 'social',
      searchText: expect.stringContaining('instagram'),
    });
    expect(options.find((o) => o.id === 'vpn')).toMatchObject({
      depth: 0,
      group: 'VPN',
      selectable: true,
    });
    expect(options.find((o) => o.id === 'social')).toMatchObject({
      isParent: true,
      label: 'Social Media',
    });
  });

  it('returns empty list for empty tree', () => {
    expect(buildCategorySelectOptions([])).toEqual([]);
    expect(buildCategorySelectOptions(null)).toEqual([]);
  });
});

describe('resolveCategorySelectLabel', () => {
  it('returns a friendly label for a category id', () => {
    expect(resolveCategorySelectLabel(
      [{ id: 'ig', name: 'Instagram Accounts' }],
      'ig',
    )).toBe('Instagram');
  });
});
