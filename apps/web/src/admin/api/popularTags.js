import { createCmsSingleton } from './cmsBackend';
import { CMS_KEYS } from '../../services/cmsApi';

export const DEFAULT_POPULAR_TAGS = {
  tags: [
    { id: 'pt-gmail', label: 'Gmail Accounts', url: '/shop?search=Gmail', enabled: true, sortOrder: 1 },
    { id: 'pt-instagram', label: 'Instagram Accounts', url: '/shop?search=Instagram', enabled: true, sortOrder: 2 },
    { id: 'pt-yahoo', label: 'Yahoo Accounts', url: '/shop?search=Yahoo', enabled: true, sortOrder: 3 },
    { id: 'pt-facebook', label: 'Facebook Accounts', url: '/shop?search=Facebook', enabled: true, sortOrder: 4 },
    { id: 'pt-tiktok', label: 'TikTok Accounts', url: '/shop?search=TikTok', enabled: true, sortOrder: 5 },
    { id: 'pt-twitter', label: 'Twitter/X Accounts', url: '/shop?search=Twitter', enabled: true, sortOrder: 6 },
    { id: 'pt-discord', label: 'Discord Accounts', url: '/shop?search=Discord', enabled: true, sortOrder: 7 },
    { id: 'pt-business-email', label: 'Business Email', url: '/shop?search=Business%20Email', enabled: true, sortOrder: 8 },
  ],
};

const resource = createCmsSingleton(CMS_KEYS.POPULAR_TAGS, DEFAULT_POPULAR_TAGS);

export const getPopularTags = resource.get;
export const updatePopularTags = resource.update;
