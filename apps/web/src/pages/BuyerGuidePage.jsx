import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck, PackageCheck, LifeBuoy } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const steps = [
  { icon: Search, title: 'Find the right listing', text: 'Browse categories or search for accounts, domains, SaaS, source code, and tools. Check seller ratings, delivery type, and stock before you buy.' },
  { icon: ShieldCheck, title: 'Checkout with protection', text: 'Pay through ApnaStore secure checkout. Funds are held with escrow protection until delivery is confirmed according to the order flow.' },
  { icon: PackageCheck, title: 'Receive your asset', text: 'Automatic listings unlock quickly after payment. Manual deliveries are completed by the seller within the stated window.' },
  { icon: LifeBuoy, title: 'Get help if needed', text: 'Open a support ticket or dispute from your account if something does not match the listing. Our team reviews issues with both parties.' },
];

const BuyerGuidePage = () => (
  <div className="min-h-screen">
    <Seo
      title="Buyer Guide"
      description="Learn how to buy digital assets safely on ApnaStore — search, checkout, delivery, escrow protection, and support."
    />
    <Header />
    <main id="main-content" className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
      <Breadcrumbs items={[{ name: 'Buyer Guide' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Buyer <span className="brand-text">Guide</span></h1>
      <p className="text-muted-foreground mt-3 max-w-lg">
        A quick walkthrough for purchasing digital products on ApnaStore with confidence.
      </p>

      <div className="mt-10 space-y-5">
        {steps.map((step, index) => (
          <section key={step.title} className="bg-white rounded-3xl border border-border p-6 flex gap-4">
            <span className="grid place-items-center w-12 h-12 rounded-2xl brand-gradient text-white shrink-0 font-bold">
              {index + 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <step.icon className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-bold">{step.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.text}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-3xl border border-border soft-shadow p-8 text-center">
        <h2 className="text-lg font-bold">Ready to shop?</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Browse verified sellers across every ApnaStore category.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white text-sm font-semibold">
            Open shop <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/faq" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-border text-sm font-semibold">
            Read FAQ
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default BuyerGuidePage;
