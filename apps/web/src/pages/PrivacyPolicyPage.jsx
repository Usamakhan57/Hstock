import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const sections = [
  { title: '1. Information We Collect', body: 'We collect information you provide directly — such as name, email, store details, and support messages — when you create an account, place an order, or contact us. We also collect limited technical data (browser, device, and usage signals) needed to operate and secure ApnaStore.' },
  { title: '2. How We Use Your Information', body: 'We use your information to operate the marketplace, process payments and escrow flows, deliver digital products, prevent fraud, provide support, and send transactional messages. Marketing emails are sent only where permitted, and you can opt out at any time.' },
  { title: '3. Sharing of Information', body: 'We do not sell personal information. Limited data may be shared with trusted processors that help us run payments, email delivery, hosting, analytics, and security — under appropriate confidentiality and data-protection commitments.' },
  { title: '4. Cookies', body: 'ApnaStore uses cookies and similar technologies for authentication, preferences, and performance. You can control cookies in your browser; some marketplace features may not work correctly if essential cookies are disabled.' },
  { title: '5. Data Security', body: 'We use industry-standard safeguards, including encryption in transit and access controls. No online service can guarantee absolute security, but we continuously improve protections around accounts, wallets, and order data.' },
  { title: '6. Your Rights', body: 'Depending on your location, you may have rights to access, correct, delete, or restrict processing of personal information. Contact support@apnastore.org or use the Contact page to submit a request.' },
  { title: '7. Data Retention', body: 'We retain account, order, and dispute records for as long as needed to operate the service and meet legal, tax, accounting, and fraud-prevention obligations.' },
  { title: '8. Children\'s Privacy', body: 'ApnaStore is not directed at children under 13, and we do not knowingly collect personal information from children.' },
  { title: '9. Changes to This Policy', body: 'We may update this policy from time to time. Material changes will be communicated by email or a notice on apnastore.org before they take effect.' },
  { title: '10. Contact Us', body: 'Questions about privacy can be sent to support@apnastore.org or through our Contact page.' },
];

const PrivacyPolicyPage = () => (
  <div className="min-h-screen">
    <Seo title="Privacy Policy" description="How ApnaStore collects, uses, and protects personal information on apnastore.org." />
    <Header />
    <div className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
      <Breadcrumbs items={[{ name: 'Privacy Policy' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Privacy <span className="brand-text">Policy</span></h1>
      <p className="text-muted-foreground mt-3">Last updated: July 31, 2026</p>
      <p className="mt-6 text-sm leading-relaxed text-foreground/85">
        This Privacy Policy explains how ApnaStore ("we", "our", "us") collects, uses, and protects your information when you use our marketplace at apnastore.org.
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

export default PrivacyPolicyPage;
