import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Store, ArrowRight, LogIn } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { useSellerAuth } from '../context/SellerAuthContext';

/** /seller — sends an already signed-in seller straight to their dashboard. */
const SellerHubPage = () => {
  const { isAuthenticated } = useSellerAuth();

  if (isAuthenticated) return <Navigate to="/seller/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Seller Center" description="Sign in to your HStock seller account or start selling your digital art today." noIndex />
      <Header />
      <div className="flex-1 grid place-items-center px-5 py-20 text-center">
        <div className="max-w-md">
          <span className="grid place-items-center w-16 h-16 rounded-full brand-gradient text-white mx-auto mb-6">
            <Store className="w-7 h-7" />
          </span>
          <h1 className="text-3xl font-black tracking-tight">Seller Center</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Sign in to manage your store, or create a seller account to start selling your digital art on HStock.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/seller/login" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow">
              <LogIn className="w-4 h-4" /> Seller Sign In
            </Link>
            <Link to="/become-a-seller" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-border font-semibold hover:bg-secondary transition-colors">
              Become a Seller <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellerHubPage;
