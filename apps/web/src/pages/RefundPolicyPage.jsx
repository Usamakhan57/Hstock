import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const sections = [
  { title: '1. Digital Products Are Final Sale', body: 'Because every product on HStock is a digital file delivered instantly after checkout, all sales are generally final and non-refundable. Please review previews, file types, and license details carefully before purchasing.' },
  { title: '2. When a Refund Is Available', body: 'We will issue a full refund or replacement if a file is corrupted and cannot be re-downloaded correctly, is significantly different from its listing description or previews, or was charged more than once for the same order.' },
  { title: '3. How to Request a Refund', body: 'Contact our support team through the Contact page within 7 days of purchase. Include your order number and a short description of the issue — screenshots help us resolve requests faster.' },
  { title: '4. Resolution Timeline', body: 'Refund requests are reviewed within 2 business days. Approved refunds are returned to your original payment method and typically appear within 5–10 business days depending on your bank.' },
  { title: '5. What Is Not Covered', body: 'Refunds are not available for accidental purchases where the files have been downloaded, change of mind, software incompatibility that was stated on the listing, or misuse of a license tier.' },
  { title: '6. Seller Payout Adjustments', body: 'When a refund is approved, the corresponding seller payout is adjusted in the seller dashboard. Repeated refunds against a listing may trigger a quality review.' },
  { title: '7. Contact', body: 'Questions about this policy can be sent through our Contact page and our team will respond as soon as possible.' },
];

const RefundPolicyPage = () => (
  <div className="min-h-screen">
    <Seo
      title="Refund Policy"
      description="HStock refund policy for digital products — when refunds are available, how to request one, and resolution timelines."
    />
    <Header />
    <main id="main-content" className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
      <Breadcrumbs items={[{ name: 'Refund Policy' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Refund <span className="brand-text">Policy</span></h1>
      <p className="text-muted-foreground mt-3">Last updated: June 1, 2026</p>
      <p className="mt-6 text-sm leading-relaxed text-foreground/85">
        We want every purchase on HStock to be a great experience. This policy explains when refunds are available for digital products and how to request one.
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-bold mb-2">{s.title}</h2>
            <p className="text-sm leading-relaxed text-foreground/80">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicyPage;
