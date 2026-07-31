import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';

const RegisterPage = () => {
  const { register } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    toast({
      title: 'Google sign-up unavailable',
      description: 'Please create an account with email and password for now.',
    });
    setGoogleLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agree) {
      setError('Please agree to the Terms & Conditions to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      toast({ title: 'Account created!', description: `Welcome to HStock, ${name.trim()}.` });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Create Account" description="Create a free HStock account for instant downloads and order history." noIndex />
      <Header />
      <div className="flex-1 grid place-items-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-border soft-shadow p-8">
            <h1 className="text-2xl font-black tracking-tight text-center">Create your account</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">Join HStock to save favorites and check out faster.</p>

            <div className="mt-8 space-y-4">
              <GoogleAuthButton label="Continue with Google" loading={googleLoading} onClick={handleGoogleAuth} />
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
                <p className="relative mx-auto inline-flex bg-white px-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  OR Sign up with Email
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="text-sm font-medium block mb-1.5">Full name</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jamie Rivera" className="bg-transparent outline-none text-sm w-full" />
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
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#6C3BFF] w-4 h-4 shrink-0" />
                I agree to the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </label>

              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

              <button type="submit" className="w-full px-6 py-3.5 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow">
                Create Account
              </button>
            </form>

            <p className="text-sm text-center text-muted-foreground mt-6">
              Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;
