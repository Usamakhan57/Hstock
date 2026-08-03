import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Shield, Clock, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import GoogleAuthButton from '../components/GoogleAuthButton';
import Logo from '../components/Logo';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';
import { authApi } from '../services/authApi';

const LoginPage = () => {
  const { login } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('google') !== 'error') return;
    const reason = searchParams.get('reason') || 'Google sign-in failed';
    setError(reason);
    toast({
      title: 'Google sign-in failed',
      description: reason,
      variant: 'destructive',
    });
  }, [searchParams, toast]);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleGoogleAuth = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const status = await authApi.googleStatus();
      if (!status?.enabled) {
        toast({
          title: 'Google sign-in not configured',
          description: 'Ask an admin to set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
          variant: 'destructive',
        });
        setGoogleLoading(false);
        return;
      }
      const returnTo = state?.from?.pathname || '/dashboard';
      window.location.assign(authApi.getGoogleAuthUrl({ intent: 'buyer', returnTo }));
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
    if (loading) return;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both an email and a password.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (trimmedPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(trimmedEmail, trimmedPassword, { remember });
      toast({ title: 'Welcome back!', description: `Signed in as ${trimmedEmail}` });
      const redirectTo = state?.from?.pathname ? `${state.from.pathname}${state.from.search || ''}` : '/';
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] px-4 py-10 sm:px-5 sm:py-16">
      <Seo title="Sign In" description="Sign in to your ApnaStore account to access your wallet, downloads, and orders." noIndex />
      <Header />
      <main className="flex-1 grid place-items-center">
        <div className="w-full max-w-[560px]">
          <div className="bg-white rounded-[24px] border border-border soft-shadow p-8 sm:p-10 lg:p-12">
            <div className="flex flex-col items-center text-center">
              <Logo size="auth" />
              <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground">Welcome Back</h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-[420px]">
                Sign in to access your buyer or seller account.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col items-center gap-2 rounded-3xl bg-secondary/70 px-4 py-3">
                  <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Secure Payments</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-3xl bg-secondary/70 px-4 py-3">
                  <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Buyer Protection</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-3xl bg-secondary/70 px-4 py-3">
                  <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">24/7 Support</p>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <GoogleAuthButton label="Continue with Google" loading={googleLoading} onClick={handleGoogleAuth} />
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
                <p className="relative mx-auto inline-flex bg-white px-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  OR Sign in with Email
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email Address</label>
                <div className="flex items-center gap-2 rounded-[14px] bg-secondary/60 px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
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

              <div>
                <div className="flex items-center justify-between gap-4 mb-1.5">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot Password?</Link>
                </div>
                <div className="flex items-center gap-2 rounded-[14px] bg-secondary/60 px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((prev) => !prev)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="text-muted-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border border-border bg-white text-primary accent-primary"
                  />
                  Remember Me
                </label>
              </div>

              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="relative flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7B4DFF] to-[#E943B4] text-sm font-semibold text-white shadow-lg shadow-[#7B4DFF]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                Sign In
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">Create Account</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
