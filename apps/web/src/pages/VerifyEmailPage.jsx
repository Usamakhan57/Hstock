import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { LOGO } from '../data';
import { authApi } from '../services/authApi';

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Verifying your email…' : 'Verification token is missing.');

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await authApi.verifyEmail(token);
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified. You can continue to your account.');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.message || 'Unable to verify email.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] px-4 py-10 sm:px-5 sm:py-16">
      <Seo title="Verify Email" description="Verify your ApnaStore account email." noIndex />
      <Header />
      <main className="flex-1 grid place-items-center">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-[24px] border border-border soft-shadow p-8 sm:p-10 text-center">
            <img src={LOGO} alt="ApnaStore" className="h-12 w-auto object-contain mx-auto" />
            <h1 className="mt-6 text-3xl font-black tracking-tight">Email Verification</h1>
            <div className="mt-6 flex flex-col items-center gap-3">
              {status === 'loading' && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
              {status === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
              {status === 'error' && <XCircle className="w-8 h-8 text-destructive" />}
              <p className="text-sm text-muted-foreground max-w-md">{message}</p>
            </div>
            <div className="mt-8">
              <Link to="/login" className="font-semibold text-primary hover:underline text-sm">
                Continue to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmailPage;
