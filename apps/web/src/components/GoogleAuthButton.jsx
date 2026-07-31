import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

const GoogleAuthButton = ({ label = 'Continue with Google', loading = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="h-14 w-full inline-flex items-center justify-center gap-3 rounded-[14px] border border-border bg-white px-5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <FaGoogle className="w-5 h-5" aria-hidden="true" />}
    {label}
  </button>
);

export default GoogleAuthButton;
