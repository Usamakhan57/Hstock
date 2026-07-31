import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Page Not Found" description="The page you\u2019re looking for doesn\u2019t exist." noIndex />
    <Header />
    <div className="flex-1 grid place-items-center px-5 py-24 text-center">
      <div className="max-w-md">
        <span className="grid place-items-center w-20 h-20 rounded-full brand-gradient text-white mx-auto mb-6">
          <Compass className="w-9 h-9" />
        </span>
        <h1 className="text-6xl font-black tracking-tight brand-text">404</h1>
        <h2 className="text-xl font-bold mt-3">Page not found</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          The page you're looking for may have been moved, renamed, or doesn't exist. Let's get you back on track.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link to="/" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow">
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/shop" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border-2 border-foreground font-semibold hover:bg-foreground hover:text-white transition-colors">
            Browse Shop
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default NotFoundPage;
