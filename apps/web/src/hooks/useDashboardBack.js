import { useNavigate } from 'react-router-dom';

/**
 * Mobile dashboard back navigation:
 * use browser history when available, otherwise fall back to a safe route.
 */
export function useDashboardBack(fallbackPath = '/') {
  const navigate = useNavigate();

  return () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath);
  };
}

export default useDashboardBack;
