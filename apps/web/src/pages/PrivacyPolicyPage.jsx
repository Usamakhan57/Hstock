import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const sections = [
  { title: '1. Information We Collect', body: 'We collect information you provide directly, such as your name, email address, and billing details when you create an account or make a purchase. We also automatically collect limited technical data — like browser type and device information — to keep the site secure and improve performance.' },
  { title: '2. How We Use Your Information', body: 'Your information is used to process orders, deliver digital downloads, provide customer support, and send order-related communications. With your consent, we may also send occasional product updates or promotions, which you can opt out of at any time.' },
  { title: '3. Sharing of Information', body: 'We do not sell your personal information. We may share limited data with trusted service providers who help us operate the platform — such as payment processors and email delivery services — under confidentiality agreements.' },
  { title: '4. Cookies', body: 'HStock uses cookies and similar technologies to keep you logged in, remember your wallet session, and understand how the site is used. You can control cookies through your browser settings, though some features may not work correctly if disabled.' },
  { title: '5. Data Security', body: 'We use industry-standard measures, including encryption in transit, to protect your information. No online service can guarantee absolute security, but we work continuously to safeguard your data.' },
  { title: '6. Your Rights', body: 'Depending on your location, you may have the right to access, correct, or delete your personal information, or to object to certain processing. To exercise these rights, contact us using the details on our Contact page.' },
  { title: '7. Data Retention', body: 'We retain account and order information for as long as your account is active or as needed to comply with legal, tax, and accounting obligations.' },
  { title: '8. Children\'s Privacy', body: 'HStock is not directed at children under 13, and we do not knowingly collect personal information from children.' },
  { title: '9. Changes to This Policy', body: 'We may update this policy from time to time. Material changes will be communicated via email or a notice on the site before they take effect.' },
  { title: '10. Contact Us', body: 'If you have questions about this policy or how your data is handled, please reach out through our Contact page and our team will respond promptly.' },
];

const PrivacyPolicyPage = () => (
  <div className="min-h-screen">
    <Seo title="Privacy Policy" description="How HStock collects, uses, and protects your personal information." />
    <Header />
    <div className="mx-auto max-w-3xl px-5 lg:px-8 pt-10 pb-24">
        <Breadcrumbs items={[{ name: 'Privacy Policy' }]} />
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">Privacy <span className="brand-text">Policy</span></h1>
      <p className="text-muted-foreground mt-3">Last updated: June 1, 2026</p>
      <p className="mt-6 text-sm leading-relaxed text-foreground/85">
        This Privacy Policy explains how HStock ("we", "our", "us") collects, uses, and protects your information when you use our marketplace.
        By using HStock, you agree to the practices described here.
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
