import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Logo from '../components/Logo';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useSellerAuth } from '../context/SellerAuthContext';
import { useToast } from '../hooks/use-toast';

const SellerLoginPage = () => {
  const { login, isAuthenticated } = useSellerAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const from = location.state?.from?.pathname || '/seller/dashboard';

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleGoogleAuth = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const { authApi } = await import('../services/authApi');
      const status = await authApi.googleStatus();
      if (!status?.enabled) {
        toast({
          title: 'Google sign-in not configured',
          description: 'Use email and password, or ask an admin to configure Google OAuth.',
          variant: 'destructive',
        });
        setGoogleLoading(false);
        return;
      }
      window.location.assign(authApi.getGoogleAuthUrl());
    } catch (err) {
      toast({
        title: 'Google sign-in failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both an email and a password.');
      return;
    }
    setError('');
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast({ title: 'Welcome back!', description: 'Signed in to your seller dashboard.' });
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Seller Sign In" description="Sign in to your ApnaStore seller dashboard." noIndex />
      <Header />
      <div className="flex-1 grid place-items-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-border soft-shadow p-8">
            <div className="flex justify-center mb-5">
              <Logo size="auth" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-center">Seller sign in</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">Access your store, products, and earnings.</p>

            <div className="mt-8 space-y-4">
              <GoogleAuthButton label="Continue with Google" loading={googleLoading} onClick={handleGoogleAuth} />
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
                <p className="relative mx-auto inline-flex bg-white px-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">OR Sign in with Email</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-transparent outline-none text-sm w-full" />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-transparent outline-none text-sm w-full" />
                  <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)} className="text-muted-foreground shrink-0">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}

              <button type="submit" className="w-full brand-gradient text-white font-semibold py-3.5 rounded-2xl hover:opacity-95 active:scale-[0.99] transition-all">
                Sign in
              </button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              New to selling? <Link to="/seller/register" className="text-primary font-semibold hover:underline">Create a seller account</Link>
            </p>
          </div>
          <p className="text-center mt-6">
            <Link to="/become-a-seller" className="text-sm font-medium text-muted-foreground hover:text-foreground">← Back to seller info</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellerLoginPage;
