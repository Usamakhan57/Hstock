import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { LOGO } from '../data';
import { authApi } from '../services/authApi';
import { useToast } from '../hooks/use-toast';

const ResetPasswordPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is missing or invalid.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] px-4 py-10 sm:px-5 sm:py-16">
      <Seo title="Reset Password" description="Choose a new HStock account password." noIndex />
      <Header />
      <main className="flex-1 grid place-items-center">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-[24px] border border-border soft-shadow p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <img src={LOGO} alt="Hstock" className="h-12 w-auto object-contain" />
              <h1 className="mt-6 text-3xl font-black tracking-tight">Reset Password</h1>
              <p className="mt-3 text-sm text-muted-foreground">Create a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="password" className="text-sm font-medium block mb-1.5">New password</label>
                <div className="flex items-center gap-2 rounded-[14px] bg-secondary/60 px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="At least 8 characters"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="text-sm font-medium block mb-1.5">Confirm password</label>
                <div className="flex items-center gap-2 rounded-[14px] bg-secondary/60 px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <input
                    id="confirm"
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="Repeat password"
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
                Update Password
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-semibold text-primary hover:underline">Back to Sign In</Link>
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
