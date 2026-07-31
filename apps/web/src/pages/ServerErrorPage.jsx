import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ServerCrash, RotateCw } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

const ServerErrorPage = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Server Error" description="Something went wrong on our end." noIndex />
    <Header />
    <div className="flex-1 grid place-items-center px-5 py-24 text-center">
      <div className="max-w-md">
        <span className="grid place-items-center w-20 h-20 rounded-full brand-gradient text-white mx-auto mb-6">
          <ServerCrash className="w-9 h-9" />
        </span>
        <h1 className="text-6xl font-black tracking-tight brand-text">500</h1>
        <h2 className="text-xl font-bold mt-3">Something went wrong on our end</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Our servers hit a snag while handling your request. It's not you — try again in a moment, or head back home.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow"
          >
            Try Again <RotateCw className="w-4 h-4" />
          </button>
          <Link to="/" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border-2 border-foreground font-semibold hover:bg-foreground hover:text-white transition-colors">
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default ServerErrorPage;
