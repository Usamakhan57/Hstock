import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { LOGO } from '../data';
import { authApi } from '../services/authApi';
import { useToast } from '../hooks/use-toast';

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      setSent(true);
      toast({
        title: 'Check your email',
        description: result.message || 'If an account exists, a reset link was sent.',
      });
    } catch (err) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] px-4 py-10 sm:px-5 sm:py-16">
      <Seo title="Forgot Password" description="Reset your HStock account password." noIndex />
      <Header />
      <main className="flex-1 grid place-items-center">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-[24px] border border-border soft-shadow p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <img src={LOGO} alt="Hstock" className="h-12 w-auto object-contain" />
              <h1 className="mt-6 text-3xl font-black tracking-tight">Forgot Password</h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-[420px]">
                Enter your account email and we&apos;ll send a secure reset link.
              </p>
            </div>

            {sent ? (
              <div className="mt-8 space-y-4 text-center">
                <p className="text-sm text-foreground">
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                </p>
                <Link to="/login" className="font-semibold text-primary hover:underline text-sm">
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                <div>
                  <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email Address</label>
                  <div className="flex items-center gap-2 rounded-[14px] bg-secondary/60 px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7B4DFF] to-[#E943B4] text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  Send Reset Link
                </button>
                <p className="text-center text-sm text-muted-foreground">
                  Remembered your password?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">Sign In</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
