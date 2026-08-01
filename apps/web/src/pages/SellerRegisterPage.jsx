import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useSellerAuth } from '../context/SellerAuthContext';
import { useToast } from '../hooks/use-toast';

const SellerRegisterPage = () => {
  const { register } = useSellerAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const { authApi } = await import('../services/authApi');
      const status = await authApi.googleStatus();
      if (!status?.enabled) {
        toast({
          title: 'Google sign-up not configured',
          description: 'Use email and password, or ask an admin to configure Google OAuth.',
          variant: 'destructive',
        });
        setGoogleLoading(false);
        return;
      }
      window.location.assign(authApi.getGoogleAuthUrl());
    } catch (err) {
      toast({
        title: 'Google sign-up failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeName.trim() || !name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agree) {
      setError('Please agree to the Seller Terms to continue.');
      return;
    }
    setError('');
    const result = await register({ storeName, name, email, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast({ title: 'Store created!', description: `Welcome to ApnaStore, ${storeName.trim()}.` });
    navigate('/seller/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Open Your Store" description="Create your ApnaStore seller account and start selling digital assets." noIndex />
      <Header />
      <div className="flex-1 grid place-items-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-border soft-shadow p-8">
            <h1 className="text-2xl font-black tracking-tight text-center">Create your seller account</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">Set up your store and start listing products.</p>

            <div className="mt-8 space-y-4">
              <GoogleAuthButton label="Continue with Google" loading={googleLoading} onClick={handleGoogleAuth} />
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
                <p className="relative mx-auto inline-flex bg-white px-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">OR Sign up with Email</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="storeName" className="text-sm font-medium block mb-1.5">Store name</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Store className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Studio Lume" className="bg-transparent outline-none text-sm w-full" />
                </div>
              </div>
              <div>
                <label htmlFor="name" className="text-sm font-medium block mb-1.5">Your name</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="bg-transparent outline-none text-sm w-full" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-transparent outline-none text-sm w-full" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium block mb-1.5">Password</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="bg-transparent outline-none text-sm w-full" />
                  <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)} className="text-muted-foreground shrink-0">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-primary" />
                I agree to the Seller Terms &amp; Conditions and licensing policies.
              </label>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}

              <button type="submit" className="w-full brand-gradient text-white font-semibold py-3.5 rounded-2xl hover:opacity-95 active:scale-[0.99] transition-all">
                Create store
              </button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Already selling? <Link to="/seller/login" className="text-primary font-semibold hover:underline">Sign in</Link>
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

export default SellerRegisterPage;
