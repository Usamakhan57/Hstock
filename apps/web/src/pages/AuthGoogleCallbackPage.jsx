import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authApi } from '../services/authApi';
import { useStore } from '../context/StoreContext';
import { defaultHomeForUser } from '../context/AuthRoles';
import Seo from '../components/Seo';

/**
 * Handles redirect from API Google OAuth callback with tokens in query string.
 * Must work in desktop browsers, mobile Chrome, and installed Android PWAs.
 */
const AuthGoogleCallbackPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile, refreshNotifications } = useStore();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = params.get('google');
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const requestedRedirect = params.get('redirect');

      if (status !== 'success' || !accessToken) {
        setError(params.get('reason') || 'Google sign-in failed');
        return;
      }

      try {
        authApi.completeGoogleSession({ accessToken, refreshToken, user: null }, { remember: true });
        const profile = await refreshProfile();
        await refreshNotifications();
        if (cancelled) return;

        const safeRedirect = requestedRedirect
          && requestedRedirect.startsWith('/')
          && !requestedRedirect.startsWith('//')
          ? requestedRedirect
          : null;
        const home = safeRedirect || defaultHomeForUser(profile?.user || profile || null);
        navigate(home, { replace: true });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to complete Google sign-in');
      }
    })();
    return () => { cancelled = true; };
  }, [params, navigate, refreshProfile, refreshNotifications]);

  return (
    <div className="min-h-screen grid place-items-center bg-[#F6F8FC] px-4">
      <Seo title="Google Sign-In" noIndex />
      <div className="bg-white rounded-3xl border border-border soft-shadow p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <h1 className="text-xl font-bold">Google sign-in failed</h1>
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-6 h-12 w-full rounded-2xl brand-gradient text-white font-semibold"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-sm font-medium">Completing Google sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthGoogleCallbackPage;
