import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Store, Upload, Wallet, BarChart3 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const steps = [
  { icon: Store, title: 'Create your seller account', text: 'Register a store name, complete your profile, and sign in to the ApnaStore seller dashboard.' },
  { icon: Upload, title: 'List production-ready products', text: 'Add a clear title, description, pricing, delivery type, stock, and media. Keep listings accurate so buyers know exactly what they receive.' },
  { icon: Wallet, title: 'Deliver and get paid', text: 'Fulfill automatic or manual orders promptly. Escrow release and wallet payouts follow the platform commerce rules.' },
  { icon: BarChart3, title: 'Manage performance', text: 'Track orders, disputes, earnings, and store settings from one dashboard. Keep inventory updated to stay competitive.' },
];

const SellerGuidePage = () => (
  <div className="min-h-screen">
    <Seo
      title="Seller Guide"
      description="Learn how to sell on ApnaStore — create listings, deliver digital products, manage escrow payouts, and grow your storefront."
    />
    <Header />
    <main id="main-content" className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
      <Breadcrumbs items={[{ name: 'Seller Guide' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Seller <span className="brand-text">Guide</span></h1>
      <p className="text-muted-foreground mt-3 max-w-lg">
        Everything you need to launch and operate a storefront on ApnaStore.
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
        <h2 className="text-lg font-bold">Start selling on ApnaStore</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Open your storefront and publish your first listing.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/become-a-seller" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white text-sm font-semibold">
            Become a seller <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/seller/login" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-border text-sm font-semibold">
            Seller sign in
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default SellerGuidePage;
