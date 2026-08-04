import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { fetchStorefrontFaqCategories } from '../services/faqRepository';
import { subscribeCmsUpdates, CMS_KEYS } from '../services/cmsApi';

const FAQPage = () => {
  const [faqCategories, setFaqCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const next = await fetchStorefrontFaqCategories();
      setFaqCategories(next);
    } catch {
      setFaqCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return subscribeCmsUpdates((detail) => {
      if (!detail?.key || detail.key === CMS_KEYS.FAQS || detail.key === CMS_KEYS.FAQ_CATEGORIES) {
        load();
      }
    });
  }, []);

  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((c) =>
      c.items.map((i) => ({
        '@type': 'Question',
        name: i.q,
        acceptedAnswer: { '@type': 'Answer', text: i.a },
      }))),
  }), [faqCategories]);

  return (
    <div className="min-h-screen">
      <Seo
        title="FAQ"
        description="Answers to common questions about buying, selling, escrow, refunds, and support on ApnaStore."
        jsonLd={jsonLd}
      />
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'FAQ' }]} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">ApnaStore <span className="brand-text">FAQ</span></h1>
        <p className="text-muted-foreground mt-3 max-w-lg">
          Everything you need to know about checkout, delivery, escrow, refunds, and selling on ApnaStore.
        </p>

        <div className="mt-10 space-y-10">
          {loading && <p className="text-sm text-muted-foreground">Loading FAQs…</p>}
          {!loading && faqCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">No published FAQs yet.</p>
          )}
          {faqCategories.map((cat) => (
            <section key={cat.title} aria-labelledby={`faq-${cat.title}`}>
              <h2 id={`faq-${cat.title}`} className="text-lg font-bold mb-3">{cat.title}</h2>
              <Accordion type="single" collapsible className="bg-white rounded-3xl border border-border soft-shadow px-6">
                {cat.items.map((item, i) => (
                  <AccordionItem key={item.q} value={`${cat.title}-${i}`} className="border-border">
                    <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline hover:text-primary">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-3xl border border-border soft-shadow p-8 text-center">
          <h2 className="text-lg font-bold">Still need help?</h2>
          <p className="text-sm text-muted-foreground mt-2">Our support team is ready to assist.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-full brand-gradient text-white text-sm font-semibold">
            Contact support <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
