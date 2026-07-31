import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { SITE } from '../constants';

/**
 * Site-wide breadcrumb trail.
 *   <Breadcrumbs items={[{ name: 'Shop', to: '/shop' }, { name: product.title }]} />
 * "Home" is always prepended; the last item renders as the current page.
 * Emits BreadcrumbList structured data for SEO.
 */
const Breadcrumbs = ({ items = [], className = '' }) => {
  const trail = [{ name: 'Home', to: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.to ? { item: `${SITE.url}${item.to}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={`mb-4 ${className}`}>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {trail.map((item, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1 min-w-0">
              {last || !item.to ? (
                <span aria-current="page" className="text-foreground font-medium truncate max-w-[14rem]">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-primary transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.name}
                </Link>
              )}
              {!last && <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/60" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
