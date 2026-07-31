import React from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash, WifiOff, RefreshCw, ArrowRight } from 'lucide-react';

/** Inline network / fetch failure state with a retry action. */
export const NetworkErrorState = ({ onRetry, message = 'We couldn\u2019t load this content. Check your connection and try again.' }) => (
  <div className="bg-white rounded-3xl border border-border soft-shadow p-10 sm:p-14 text-center">
    <span className="grid place-items-center w-16 h-16 rounded-full bg-secondary text-primary mx-auto mb-5">
      <WifiOff className="w-7 h-7" aria-hidden="true" />
    </span>
    <h2 className="text-lg font-bold">Connection problem</h2>
    <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{message}</p>
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      )}
      <Link to="/" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-white border border-border text-sm font-semibold hover:bg-secondary transition-colors">
        Back to Home <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
);

/** Full-page 500 screen shown by the ErrorBoundary on unexpected crashes. */
export const ServerErrorPage = ({ onReset }) => (
  <div className="min-h-screen grid place-items-center px-5 py-24 text-center bg-background">
    <div className="max-w-md">
      <span className="grid place-items-center w-20 h-20 rounded-full brand-gradient text-white mx-auto mb-6">
        <ServerCrash className="w-9 h-9" aria-hidden="true" />
      </span>
      <h1 className="text-6xl font-black tracking-tight brand-text">500</h1>
      <h2 className="text-xl font-bold mt-3">Something went wrong</h2>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        An unexpected error occurred on our side. Refresh the page, or head back to the homepage while we look into it.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <button
          type="button"
          onClick={onReset || (() => window.location.reload())}
          className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full brand-gradient text-white font-semibold soft-shadow hover:soft-shadow-lg transition-shadow"
        >
          <RefreshCw className="w-4 h-4" /> Reload page
        </button>
        <a href="/" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border-2 border-foreground font-semibold hover:bg-foreground hover:text-white transition-colors">
          Back to Home
        </a>
      </div>
    </div>
  </div>
);

/** Catches render errors anywhere below it and shows the 500 page. */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Hook a logging service (e.g. Sentry) here in production.
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage onReset={() => { this.setState({ hasError: false }); window.location.assign('/'); }} />;
    }
    return this.props.children;
  }
}
