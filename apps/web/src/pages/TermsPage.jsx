import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const sections = [
  { title: '1. Acceptance of Terms', body: 'By accessing or using HStock, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform.' },
  { title: '2. Account Registration', body: 'You must provide accurate information when creating an account and are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.' },
  { title: '3. Digital Products & Licensing', body: 'Every product is sold under a specific license — Personal, Commercial, or Extended Commercial — as described on the product page. You agree to use downloaded files only within the scope of the license you purchase, and not to resell, redistribute, or claim raw files as your own original work.' },
  { title: '4. Payments', body: 'All prices are listed in US dollars unless otherwise noted. Payments are processed securely through our third-party payment provider; HStock does not store your full card details.' },
  { title: '5. Refunds', body: 'Because digital products are delivered instantly, all sales are generally final. If a file is corrupted, mislabeled, or significantly different from its listing, contact support within 7 days for a resolution.' },
  { title: '6. Seller Terms', body: 'Artists who list products on HStock retain ownership of their original work and are responsible for the accuracy of their listings and the legality of the content they upload. HStock reserves the right to remove listings that violate these terms.' },
  { title: '7. Prohibited Conduct', body: 'You may not use the platform to upload infringing content, attempt to bypass licensing restrictions, scrape the site, or interfere with its normal operation.' },
  { title: '8. Intellectual Property', body: 'All site design, branding, and platform code remain the property of HStock. Product files remain the property of their respective creators, licensed to buyers under the terms selected at checkout.' },
  { title: '9. Limitation of Liability', body: 'HStock is provided "as is." To the fullest extent permitted by law, we are not liable for indirect or consequential damages arising from your use of the platform or downloaded products.' },
  { title: '10. Changes to These Terms', body: 'We may revise these terms periodically. Continued use of HStock after changes take effect constitutes acceptance of the updated terms.' },
  { title: '11. Governing Law', body: 'These terms are governed by the laws of the State of Texas, USA, without regard to conflict-of-law principles.' },
  { title: '12. Contact', body: 'Questions about these terms can be sent through our Contact page and our team will respond as soon as possible.' },
];

const TermsPage = () => (
  <div className="min-h-screen">
    <Seo title="Terms & Conditions" description="The terms that govern buying, selling, and browsing on HStock, including licensing rules for digital products." />
    <Header />
    <div className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'Terms & Conditions' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Terms & <span className="brand-text">Conditions</span></h1>
      <p className="text-muted-foreground mt-3">Last updated: June 1, 2026</p>
      <p className="mt-6 text-sm leading-relaxed text-foreground/85">
        These Terms & Conditions govern your use of HStock. Please read them carefully before buying, selling, or browsing on the platform.
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
