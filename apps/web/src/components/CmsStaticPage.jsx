import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { fetchStaticPageBySlug } from '../services/staticPagesRepository';
import { subscribeCmsUpdates, CMS_KEYS } from '../services/cmsApi';

/**
 * Renders a published CMS static page by slug.
 * Falls back to empty state (no hardcoded legal copy).
 */
const CmsStaticPage = ({
  slug,
  fallbackTitle,
  breadcrumb,
}) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setPage(await fetchStaticPageBySlug(slug));
    } catch {
      setPage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return subscribeCmsUpdates((detail) => {
      if (!detail?.key || detail.key === CMS_KEYS.STATIC_PAGES) load();
    });
  }, [slug]);

  const title = page?.title || fallbackTitle || slug;
  const paragraphs = String(page?.content || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen">
      <Seo
        title={page?.seoTitle || title}
        description={page?.metaDescription || ''}
      />
      <Header />
      <div className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: breadcrumb || title }]} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{title}</h1>
        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : paragraphs.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">This page has not been published in CMS yet.</p>
        ) : (
          <div className="mt-10 space-y-6">
            {paragraphs.map((body) => (
              <p key={body.slice(0, 48)} className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                {body}
              </p>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CmsStaticPage;
