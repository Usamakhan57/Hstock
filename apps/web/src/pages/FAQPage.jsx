import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { getStorefrontFaqCategories } from '../services/faqRepository';

const FAQPage = () => {
  const faqCategories = getStorefrontFaqCategories();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((c) =>
      c.items.map((i) => ({
        '@type': 'Question',
        name: i.q,
        acceptedAnswer: { '@type': 'Answer', text: i.a },
      }))),
  };

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
          <h2 className="text-lg font-bold">Still have a question?</h2>
          <p className="text-sm text-muted-foreground mt-1.5">Our support team usually replies within one business day.</p>
          <Link to="/contact" className="mt-5 inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 transition-all">
            Contact support <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
