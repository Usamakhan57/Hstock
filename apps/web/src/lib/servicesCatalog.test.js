import { describe, expect, it } from 'vitest';
import {
  buildServiceSections,
  displayServiceName,
  matchServiceSection,
} from './servicesCatalog';

describe('servicesCatalog', () => {
  it('shortens account labels for compact cards', () => {
    expect(displayServiceName('Instagram Accounts')).toBe('Instagram');
    expect(displayServiceName('Gmail Accounts')).toBe('Gmail');
    expect(displayServiceName('Netflix')).toBe('Netflix');
  });

  it('matches known root groups to premium section headings', () => {
    expect(matchServiceSection({ name: 'Social Accounts', slug: 'social-accounts' })?.heading).toBe('Social Media');
    expect(matchServiceSection({ name: 'Email Accounts', slug: 'email-accounts' })?.heading).toBe('Email');
    expect(matchServiceSection({ name: 'Gaming', slug: 'gaming' })?.heading).toBe('Gaming');
    expect(matchServiceSection({ name: 'Other Digital Assets', slug: 'other-digital-assets' })?.heading).toBe('Other Services');
  });

  it('builds ordered sections with children as cards and live counts', () => {
    const tree = [
      {
        id: 'social',
        name: 'Social Accounts',
        slug: 'social-accounts',
        children: [
          { id: 'ig', name: 'Instagram Accounts', slug: 'instagram-accounts', productCount: 0 },
          { id: 'fb', name: 'Facebook Accounts', slug: 'facebook-accounts', productCount: 0 },
        ],
      },
      {
        id: 'games',
        name: 'Gaming',
        slug: 'gaming',
        children: [
          { id: 'steam', name: 'Steam', slug: 'steam', productCount: 0 },
        ],
      },
      {
        id: 'gift',
        name: 'Gift Cards',
        slug: 'gift-cards',
        children: [],
        productCount: 0,
      },
    ];

    const sections = buildServiceSections(tree, {
      ig: 12,
      fb: 4,
      steam: 3,
      gift: 7,
    });

    expect(sections.map((s) => s.heading)).toEqual(['Social Media', 'Gaming', 'Gift Cards']);
    expect(sections[0].cards.map((c) => c.displayName)).toEqual(['Instagram', 'Facebook']);
    expect(sections[0].cards[0].count).toBe(12);
    expect(sections[1].cards[0].count).toBe(3);
    expect(sections[2].cards).toHaveLength(1);
    expect(sections[2].cards[0].count).toBe(7);
    expect(sections[2].cards[0].slug).toBe('gift-cards');
  });

  it('appends unmatched roots after preferred sections', () => {
    const sections = buildServiceSections([
      {
        id: 'custom',
        name: 'Custom Tools',
        slug: 'custom-tools',
        children: [{ id: 'a', name: 'Alpha', slug: 'alpha' }],
      },
      {
        id: 'vpn',
        name: 'VPN',
        slug: 'vpn',
        children: [],
      },
    ], { a: 1, vpn: 2 });

    expect(sections[0].heading).toBe('VPN');
    expect(sections[1].heading).toBe('Custom Tools');
    expect(sections[1].cards[0].displayName).toBe('Alpha');
  });
});
