import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const sections = [
  { title: '1. Acceptance of Terms', body: 'By accessing or using ApnaStore at apnastore.org, you agree to these Terms & Conditions. If you do not agree, do not use the marketplace.' },
  { title: '2. Account Registration', body: 'You must provide accurate information when creating a buyer or seller account. You are responsible for protecting your login credentials and for activity under your account.' },
  { title: '3. Marketplace Listings', body: 'ApnaStore hosts digital listings such as social accounts, domains, websites, SaaS, source code, apps, AI tools, templates, courses, and related assets. Sellers are responsible for the legality, accuracy, and deliverability of what they list.' },
  { title: '4. Payments & Escrow', body: 'Prices are shown in the currency displayed on each listing. Payments are processed through approved providers. Where escrow applies, funds are held according to platform commerce rules until delivery conditions are met.' },
  { title: '5. Delivery & Access', body: 'Automatic listings unlock after successful payment. Manual listings are fulfilled by the seller within the stated delivery window. Buyers should follow handover instructions carefully and keep order records.' },
  { title: '6. Refunds & Disputes', body: 'Refund eligibility is governed by the ApnaStore Refund Policy. Buyers may open disputes for eligible delivery or quality issues. ApnaStore may review evidence from both parties and issue a binding resolution.' },
  { title: '7. Seller Obligations', body: 'Sellers must keep inventory accurate, communicate professionally, and deliver what was sold. ApnaStore may suspend or remove accounts or listings that violate these terms, applicable law, or marketplace standards.' },
  { title: '8. Prohibited Conduct', body: 'You may not list stolen or unauthorized assets, misrepresent products, attempt payment fraud, scrape the platform, abuse support channels, or interfere with marketplace operations.' },
  { title: '9. Intellectual Property', body: 'ApnaStore branding, site design, and platform software remain our property. Listing content and digital assets remain the responsibility of their respective owners, subject to the rights granted at sale.' },
  { title: '10. Limitation of Liability', body: 'ApnaStore is provided as available. To the fullest extent permitted by law, we are not liable for indirect or consequential damages arising from marketplace use, third-party listings, or delivery disputes beyond the remedies described in our policies.' },
  { title: '11. Changes to These Terms', body: 'We may update these terms periodically. Continued use of ApnaStore after changes take effect constitutes acceptance of the updated terms.' },
  { title: '12. Contact', body: 'Questions about these terms can be sent to support@apnastore.org or through our Contact page.' },
];

const TermsPage = () => (
  <div className="min-h-screen">
    <Seo
      title="Terms & Conditions"
      description="Terms that govern buying, selling, escrow, delivery, and account use on ApnaStore."
    />
    <Header />
    <div className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
      <Breadcrumbs items={[{ name: 'Terms & Conditions' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Terms & <span className="brand-text">Conditions</span></h1>
      <p className="text-muted-foreground mt-3">Last updated: July 31, 2026</p>
      <p className="mt-6 text-sm leading-relaxed text-foreground/85">
        These Terms & Conditions govern your use of ApnaStore. Please read them carefully before buying, selling, or browsing on the platform.
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="text-lg font-bold mb-2">{s.title}</h2>
            <p className="text-sm leading-relaxed text-foreground/80">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

export default TermsPage;
