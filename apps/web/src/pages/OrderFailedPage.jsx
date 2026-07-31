import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { XCircle, RotateCw, LifeBuoy, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

const OrderFailedPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const reason = state?.reason || 'Your payment could not be processed.';

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Payment Failed" description="Your HStock order could not be completed." noIndex />
      <Header />
      <div className="flex-1 mx-auto max-w-lg w-full px-5 py-20 text-center">
        <span className="grid place-items-center w-20 h-20 rounded-full bg-red-100 text-destructive mx-auto mb-6">
          <XCircle className="w-9 h-9" />
        </span>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Payment failed</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">{reason} No charge was made to your wallet.</p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={() => navigate('/wallet')}
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow"
          >
            <RotateCw className="w-4 h-4" /> Retry Payment
          </button>
          <Link to="/support" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-border font-semibold hover:bg-secondary transition-colors">
            <LifeBuoy className="w-4 h-4" /> Contact Support
          </Link>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-1.5 justify-center mt-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to shop
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default OrderFailedPage;
