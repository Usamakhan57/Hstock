import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useCms } from '../hooks/useCms';
import { CMS_KEYS } from '../services/cmsApi';

function matchSeoEntry(entries, pathname, pageType) {
  const list = Array.isArray(entries) ? entries : [];
  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

  if (pageType) {
    const byType = list.find((e) => String(e.pageType || '').toLowerCase() === String(pageType).toLowerCase());
    if (byType) return byType;
  }

  const byPath = list.find((e) => {
    const canonical = String(e.canonicalUrl || e.path || '').trim();
    if (!canonical) return false;
    const normalized = canonical.startsWith('http')
      ? new URL(canonical).pathname
      : canonical;
    const p = normalized === '/' ? '/' : normalized.replace(/\/$/, '');
    return p === path;
  });
  return byPath || null;
}

/**
 * Per-page SEO driven by CMS (SEO Manager + Global brand).
 * Admin controls meta title, description, keywords, OG, Twitter, canonical, robots.
 */
const Seo = ({
  title,
  description,
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
  canonical: canonicalOverride,
  robotsContent,
  ogTitle,
  ogDescription,
  twitterCard,
  twitterTitle,
  twitterDescription,
  twitterImage,
  pageType,
  keywords: keywordsProp,
}) => {
  const { pathname } = useLocation();
  const { data: seoDoc } = useCms(CMS_KEYS.SEO);
  const { data: global } = useCms(CMS_KEYS.GLOBAL);

  const entry = useMemo(
    () => matchSeoEntry(seoDoc?.items, pathname, pageType),
    [seoDoc, pathname, pageType],
  );

  const siteName = global?.siteName || '';
  const siteTagline = global?.slogan || global?.tagline || '';
  const siteUrl = (global?.siteUrl || '').replace(/\/$/, '');
  const twitterSite = global?.twitterHandle || '';

  const metaTitle = title || entry?.metaTitle || '';
  const metaDescription = description || entry?.metaDescription || '';
  const keywords = keywordsProp || entry?.keywords || '';
  const fullTitle = metaTitle
    || (siteName && siteTagline ? `${siteName} — ${siteTagline}` : siteName)
    || 'Marketplace';

  const canonicalPath = canonicalOverride
    || entry?.canonicalUrl
    || `${pathname === '/' ? '/' : pathname}`;
  const canonical = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${siteUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  const robots = robotsContent
    || entry?.robots
    || (noIndex ? 'noindex,nofollow' : null);

  const resolvedImage = image || entry?.ogImage || '';
  const resolvedOgTitle = ogTitle || entry?.ogTitle || fullTitle;
  const resolvedOgDescription = ogDescription || entry?.ogDescription || metaDescription;
  const resolvedTwitterImage = twitterImage || entry?.twitterImage || resolvedImage;
  const resolvedTwitterCard = twitterCard || entry?.twitterCard || (resolvedTwitterImage ? 'summary_large_image' : 'summary');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {metaDescription && <meta name="description" content={metaDescription} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {robots && <meta name="robots" content={robots} />}

      {siteName && <meta property="og:site_name" content={siteName} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedOgTitle} />
      {resolvedOgDescription && <meta property="og:description" content={resolvedOgDescription} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}

      <meta name="twitter:card" content={resolvedTwitterCard} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      <meta name="twitter:title" content={twitterTitle || entry?.twitterTitle || resolvedOgTitle} />
      {(twitterDescription || entry?.twitterDescription || resolvedOgDescription) && (
        <meta name="twitter:description" content={twitterDescription || entry?.twitterDescription || resolvedOgDescription} />
      )}
      {resolvedTwitterImage && <meta name="twitter:image" content={resolvedTwitterImage} />}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};

export default Seo;
