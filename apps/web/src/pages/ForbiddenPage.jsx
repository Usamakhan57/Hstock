import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

const ForbiddenPage = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Access Denied" description="You don't have permission to view this page." noIndex />
    <Header />
    <div className="flex-1 grid place-items-center px-5 py-24 text-center">
      <div className="max-w-md">
        <span className="grid place-items-center w-20 h-20 rounded-full brand-gradient text-white mx-auto mb-6">
          <ShieldAlert className="w-9 h-9" />
        </span>
        <h1 className="text-6xl font-black tracking-tight brand-text">403</h1>
        <h2 className="text-xl font-bold mt-3">Access denied</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          You don't have permission to view this page. If you think this is a mistake, try signing in with the right account.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link to="/" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow">
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border-2 border-foreground font-semibold hover:bg-foreground hover:text-white transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default ForbiddenPage;
