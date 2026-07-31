import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, WifiOff, RotateCw } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

const NetworkErrorPage = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Connection Lost" description="We couldn't reach HStock. Check your connection and try again." noIndex />
    <Header />
    <div className="flex-1 grid place-items-center px-5 py-24 text-center">
      <div className="max-w-md">
        <span className="grid place-items-center w-20 h-20 rounded-full brand-gradient text-white mx-auto mb-6">
          <WifiOff className="w-9 h-9" />
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Connection lost</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          We couldn't reach HStock. Check your internet connection and try again — your wallet and orders are safe.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow"
          >
            Retry <RotateCw className="w-4 h-4" />
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

export default NetworkErrorPage;
