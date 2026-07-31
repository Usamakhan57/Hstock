import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../AdminAuthContext';
import logo from '../assets/hstock-logo.png';

const AdminLoginPage = () => {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/admin';

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

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
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#F7F7FB] px-5 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="HStock" className="h-16 w-auto object-contain" />
        </div>
        <div className="bg-white rounded-3xl border border-border soft-shadow p-8">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Admin Panel</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-center">Admin sign in</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">Restricted area — authorized staff only.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email</label>
              <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hstock.store" className="bg-transparent outline-none text-sm w-full" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium block mb-1.5">Password</label>
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

          <p className="text-xs text-muted-foreground text-center mt-6">
            Demo credentials: admin@hstock.store / admin123
          </p>
        </div>
        <p className="text-center mt-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">← Back to store</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
