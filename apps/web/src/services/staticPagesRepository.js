import { cmsApi, CMS_KEYS } from './cmsApi';

export async function fetchStaticPageBySlug(slug) {
  const data = await cmsApi.get(CMS_KEYS.STATIC_PAGES);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.find((page) => page.slug === slug && page.status === 'published') || null;
}

export default {
  fetchStaticPageBySlug,
};
