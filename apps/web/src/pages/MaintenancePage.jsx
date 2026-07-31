import React from 'react';
import { Wrench } from 'lucide-react';
import Seo from '../components/Seo';

/** Standalone full-screen page (no Header/Footer) shown when the storefront is offline for maintenance. */
const MaintenancePage = () => (
  <div className="min-h-screen grid place-items-center px-5 py-24 text-center bg-background">
    <Seo title="Under Maintenance" description="ApnaStore is undergoing scheduled maintenance." noIndex />
    <div className="max-w-md">
      <span className="grid place-items-center w-20 h-20 rounded-full brand-gradient text-white mx-auto mb-6">
        <Wrench className="w-9 h-9" />
      </span>
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">We'll be right back</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        ApnaStore is undergoing scheduled maintenance to make things even better. Thanks for your patience — please check back shortly.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1.5 mt-8 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

export default MaintenancePage;
