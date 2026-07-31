import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { SITE } from '../constants';

/**
 * Per-page SEO. Drop one <Seo /> at the top of every page:
 *   <Seo title="Shop" description="..." image={cover} jsonLd={schema} />
 * Handles unique titles, meta description, canonical URL, Open Graph,
 * Twitter cards, and optional structured data.
 */
const Seo = ({
  title, description = SITE.description, image, type = 'website', jsonLd, noIndex = false,
  canonical: canonicalOverride, robotsContent,
  ogTitle, ogDescription,
  twitterCard, twitterTitle, twitterDescription, twitterImage,
}) => {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const canonical = canonicalOverride || `${SITE.url}${pathname === '/' ? '' : pathname}`;
  const robots = robotsContent || (noIndex ? 'noindex,nofollow' : null);
  const resolvedOgTitle = ogTitle || fullTitle;
  const resolvedOgDescription = ogDescription || description;
  const resolvedTwitterImage = twitterImage || image;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {robots && <meta name="robots" content={robots} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard || (resolvedTwitterImage ? 'summary_large_image' : 'summary')} />
      <meta name="twitter:site" content={SITE.twitter} />
      <meta name="twitter:title" content={twitterTitle || resolvedOgTitle} />
      <meta name="twitter:description" content={twitterDescription || resolvedOgDescription} />
      {resolvedTwitterImage && <meta name="twitter:image" content={resolvedTwitterImage} />}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};

export default Seo;
