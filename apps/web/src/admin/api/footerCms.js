import { createCmsSingleton } from './cmsBackend';
import { seedFooterCms } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const DEFAULT_FOOTER = {
  ...seedFooterCms,
  columns: [
    {
      title: 'Marketplace',
      links: [
        { name: 'Shop All', to: '/shop' },
        { name: 'Categories', to: '/categories' },
        { name: 'Best Sellers', to: '/shop?sort=Most%20Popular' },
        { name: 'Become a Seller', to: '/become-a-seller' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', to: '/about' },
        { name: 'Blog', to: '/blog' },
        { name: 'Contact', to: '/contact' },
        { name: 'Seller Hub', to: '/seller' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'FAQ', to: '/faq' },
        { name: 'Buyer Guide', to: '/buyer-guide' },
        { name: 'Seller Guide', to: '/seller-guide' },
        { name: 'Help Center', to: '/support' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', to: '/privacy' },
        { name: 'Terms & Conditions', to: '/terms' },
        { name: 'Refund Policy', to: '/refund-policy' },
        { name: 'Cookie Policy', to: '/cookie-policy' },
      ],
    },
  ],
};

const resource = createCmsSingleton(CMS_KEYS.FOOTER, DEFAULT_FOOTER);

export const getFooterCms = resource.get;
export const updateFooterCms = resource.update;
