import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, Eye, EyeOff, Loader2, Send } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import Logo from '../components/Logo';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useSellerAuth } from '../context/SellerAuthContext';
import { useToast } from '../hooks/use-toast';
import { telegramApi } from '../services/telegramApi';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

const SellerRegisterPage = () => {
  const { register, isAuthenticated } = useSellerAuth();
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
  const [accountCreated, setAccountCreated] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState('idle'); // idle | connecting | connected
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pollTimerRef = useRef(null);

  const telegramConnected = telegramStatus === 'connected';

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!isAuthenticated && !accountCreated) return undefined;
    let cancelled = false;
    telegramApi.status()
      .then((status) => {
        if (cancelled) return;
        if (status.connected) {
          setTelegramStatus('connected');
          setAccountCreated(true);
          stopPolling();
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, accountCreated, stopPolling]);

  const validateForm = () => {
    if (!storeName.trim() || !name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (!agree) {
      setError('Please agree to the Seller Terms to continue.');
      return false;
    }
    setError('');
    return true;
  };

  const ensureSellerAccount = async () => {
    if (accountCreated || isAuthenticated) {
      setAccountCreated(true);
      return { ok: true };
    }
    setCreatingAccount(true);
    try {
      const result = await register({ storeName, name, email, password });
      if (!result.ok) {
        setError(result.error);
        return { ok: false, error: result.error };
      }
      setAccountCreated(true);
      return { ok: true };
    } finally {
      setCreatingAccount(false);
    }
  };

  const startTelegramPolling = () => {
    stopPolling();
    setTelegramStatus('connecting');
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    pollTimerRef.current = setInterval(async () => {
      if (Date.now() > deadline) {
        stopPolling();
        setTelegramStatus('idle');
        toast({
          title: 'Still waiting for Telegram',
          description: 'Open the ApnaStore bot and press Start, then try Connect Telegram again.',
        });
        return;
      }
      try {
        const status = await telegramApi.status();
        if (status.connected) {
          stopPolling();
          setTelegramStatus('connected');
          toast({
            title: 'Telegram Connected ✅',
            description: 'You can now create your seller account.',
          });
        }
      } catch {
        // Keep polling while the bot handshake completes.
      }
    }, POLL_INTERVAL_MS);
  };

  const handleConnectTelegram = async () => {
    if (!validateForm()) return;
    setTelegramBusy(true);
    setError('');
    try {
      const ensured = await ensureSellerAccount();
      if (!ensured.ok) return;

      setTelegramStatus('connecting');
      const result = await telegramApi.connect();
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast({
          title: 'Continue in Telegram',
          description: 'Press Start in the ApnaStore bot to finish connecting.',
        });
      }
      if (result.status?.connected) {
        setTelegramStatus('connected');
        stopPolling();
        toast({
          title: 'Telegram Connected ✅',
          description: 'You can now create your seller account.',
        });
        return;
      }
      startTelegramPolling();
    } catch (err) {
      setTelegramStatus('idle');
      setError(err.message || 'Could not start Telegram connection.');
      toast({
        title: 'Could not start Telegram connect',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTelegramBusy(false);
    }
  };

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
      window.location.assign(authApi.getGoogleAuthUrl({ intent: 'seller', returnTo: '/seller/dashboard' }));
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
    if (!validateForm()) return;
    if (!telegramConnected) {
      setError('Connect Telegram before creating your seller account.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const ensured = await ensureSellerAccount();
      if (!ensured.ok) return;

      // Re-check Telegram in case connection dropped after account creation.
      const status = await telegramApi.status().catch(() => null);
      if (!status?.connected) {
        setTelegramStatus('idle');
        setError('Telegram is not connected yet. Connect the bot, then try again.');
        return;
      }

      toast({ title: 'Store created!', description: `Welcome to ApnaStore, ${storeName.trim()}.` });
      navigate('/seller/dashboard', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const statusCopy = telegramConnected
    ? 'Connected ✅'
    : telegramStatus === 'connecting'
      ? 'Connecting...'
      : 'Not Connected';

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Open Your Store" description="Create your ApnaStore seller account and start selling digital assets." noIndex />
      <Header />
      <div className="flex-1 grid place-items-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-border soft-shadow p-8">
            <div className="flex justify-center mb-5">
              <Logo size="auth" />
            </div>
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
                  <input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Studio Lume"
                    disabled={accountCreated}
                    className="bg-transparent outline-none text-sm w-full disabled:opacity-70"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="name" className="text-sm font-medium block mb-1.5">Your name</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    disabled={accountCreated}
                    className="bg-transparent outline-none text-sm w-full disabled:opacity-70"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={accountCreated}
                    className="bg-transparent outline-none text-sm w-full disabled:opacity-70"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium block mb-1.5">Password</label>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={accountCreated}
                    className="bg-transparent outline-none text-sm w-full disabled:opacity-70"
                  />
                  <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)} className="text-muted-foreground shrink-0">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  disabled={accountCreated}
                  className="mt-0.5 accent-primary"
                />
                I agree to the Seller Terms &amp; Conditions and licensing policies.
              </label>

              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div>
                  <h2 className="text-sm font-bold inline-flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#229ED9]" />
                    Telegram Connection
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect the existing ApnaStore Telegram bot before creating your seller account. Order and payout alerts use this connection.
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-border px-3 py-2.5 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
                  <p className={`mt-1 font-semibold ${
                    telegramConnected
                      ? 'text-emerald-700'
                      : telegramStatus === 'connecting'
                        ? 'text-sky-700'
                        : 'text-muted-foreground'
                  }`}
                  >
                    ○ {statusCopy}
                  </p>
                </div>

                {telegramConnected ? (
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800">
                    Telegram Connected ✅
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectTelegram}
                    disabled={telegramBusy || creatingAccount || telegramStatus === 'connecting'}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
                    style={{ backgroundColor: '#229ED9' }}
                  >
                    {(telegramBusy || creatingAccount || telegramStatus === 'connecting')
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />}
                    {telegramStatus === 'connecting' ? 'Connecting…' : 'Connect Telegram Bot'}
                  </button>
                )}
              </div>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}

              <button
                type="submit"
                disabled={!telegramConnected || submitting}
                className="w-full brand-gradient text-white font-semibold py-3.5 rounded-2xl hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating seller account…' : 'Create Seller Account'}
              </button>
              {!telegramConnected ? (
                <p className="text-xs text-center text-muted-foreground">
                  Create Seller Account stays disabled until Telegram is connected.
                </p>
              ) : null}
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
