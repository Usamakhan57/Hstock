import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import { ServiceCardSkeleton } from '../components/Skeletons';
import { getServiceSections } from '../services/categoryRepository';
import { useStore } from '../context/StoreContext';

function ServiceCard({ card }) {
  const Icon = typeof card.icon === 'function' ? card.icon : Folder;
  const accent = card.color || '#6C3BFF';
  const countLabel = `${Number(card.count || 0).toLocaleString()} ${card.count === 1 ? 'Product' : 'Products'}`;

  return (
    <Link
      to={`/category/${card.slug}`}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-white px-3 py-5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_28px_-16px_rgba(108,59,255,0.45)] sm:rounded-[1.15rem] sm:px-4 sm:py-6"
      data-testid={`service-card-${card.slug}`}
    >
      <span
        className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl sm:h-16 sm:w-16"
        style={{ background: `${accent}14`, color: accent }}
      >
        {card.image && /^(https?:\/\/|\/|data:)/i.test(String(card.image)) ? (
          <img
            src={card.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 w-full space-y-1">
        <span className="block truncate text-[13px] font-bold leading-tight text-foreground sm:text-sm">
          {card.displayName || card.name}
        </span>
        <span className="block text-[11px] text-muted-foreground sm:text-xs">
          {countLabel}
        </span>
      </span>
    </Link>
  );
}

const CategoriesPage = () => {
  const { catalogReady, catalogVersion } = useStore();
  const sections = useMemo(() => getServiceSections(), [catalogVersion]);
  const totalProducts = sections.reduce((sum, section) => sum + section.totalProducts, 0);
  const totalServices = sections.reduce((sum, section) => sum + section.cards.length, 0);

  return (
    <div className="min-h-screen bg-[hsl(220_33%_98%)]">
      <Seo
        title="Services & Categories"
        description="Browse ApnaStore digital services — social media, gaming, streaming, hosting, email, software, AI tools, crypto, and more."
      />
      <Header />

      <div className="mx-auto max-w-[90rem] px-4 pb-20 pt-8 sm:px-5 lg:px-8 lg:pt-10">
        <Breadcrumbs items={[{ name: 'Services' }]} />

        <header className="mt-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Marketplace</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Services
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {catalogReady
              ? `${totalServices.toLocaleString()} services across ${sections.length} groups · ${totalProducts.toLocaleString()} live products`
              : 'Loading marketplace services…'}
          </p>
        </header>

        {!catalogReady ? (
          <div className="mt-10 space-y-12">
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
              <section key={sectionIndex}>
                <div className="mb-5 h-8 w-40 animate-pulse rounded-lg bg-secondary" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                  {Array.from({ length: 8 }).map((__, cardIndex) => (
                    <ServiceCardSkeleton key={cardIndex} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No services yet"
              message="Services will appear here once the catalog is available."
            />
          </div>
        ) : (
          <div className="mt-10 space-y-12 sm:space-y-14" data-testid="services-sections">
            {sections.map((section) => (
              <section
                key={section.key}
                aria-labelledby={`service-section-${section.key}`}
                data-testid={`service-section-${section.key}`}
              >
                <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
                  <h2
                    id={`service-section-${section.key}`}
                    className="text-2xl font-black tracking-tight text-foreground sm:text-3xl"
                  >
                    {section.heading}
                  </h2>
                  <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                    {section.cards.length} {section.cards.length === 1 ? 'service' : 'services'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                  {section.cards.map((card) => (
                    <ServiceCard key={card.id} card={card} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CategoriesPage;
