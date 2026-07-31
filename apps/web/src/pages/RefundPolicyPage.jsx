import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const sections = [
  { title: '1. Digital Marketplace Sales', body: 'ApnaStore sells digital assets that may unlock immediately after payment. Because of the nature of digital delivery, many sales are final once access has been granted. Always review listing details, delivery type, and seller reputation before checkout.' },
  { title: '2. When a Refund May Be Available', body: 'Refunds or replacements may be available when a listing is materially different from what was sold, delivery fails without a valid reason, access credentials are unusable at handover through no fault of the buyer, or a duplicate charge occurs for the same order.' },
  { title: '3. Escrow & Disputes', body: 'Where escrow applies, buyers can open a dispute within the allowed window. ApnaStore reviews evidence from both parties and may release funds to the seller, refund the buyer, or apply another resolution consistent with marketplace rules.' },
  { title: '4. How to Request Help', body: 'Contact support@apnastore.org or open a ticket from your account. Include your order number, listing title, and a clear description of the issue. Screenshots or delivery logs help us resolve cases faster.' },
  { title: '5. Resolution Timeline', body: 'Eligible requests are typically reviewed within a few business days. Approved refunds return to the original payment method or wallet balance according to the payment provider and commerce flow.' },
  { title: '6. What Is Not Covered', body: 'Refunds are generally not available for buyer remorse after successful delivery, failure to follow handover instructions, incompatibility that was disclosed in the listing, or misuse of delivered assets.' },
  { title: '7. Seller Adjustments', body: 'When a refund is approved, related seller payouts and escrow balances are adjusted. Repeated quality issues may trigger listing or account review.' },
  { title: '8. Contact', body: 'Questions about this policy can be sent through our Contact page or to support@apnastore.org.' },
];

const RefundPolicyPage = () => (
  <div className="min-h-screen">
    <Seo
      title="Refund Policy"
      description="ApnaStore refund and dispute policy for digital marketplace purchases, escrow orders, and delivery issues."
    />
    <Header />
    <main id="main-content" className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
      <Breadcrumbs items={[{ name: 'Refund Policy' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Refund <span className="brand-text">Policy</span></h1>
      <p className="text-muted-foreground mt-3">Last updated: July 31, 2026</p>
      <p className="mt-6 text-sm leading-relaxed text-foreground/85">
        This policy explains when refunds, replacements, or dispute resolutions may apply for purchases on ApnaStore.
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
