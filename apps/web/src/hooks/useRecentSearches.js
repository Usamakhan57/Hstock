import { useCallback, useState } from 'react';
import { RECENT_SEARCHES_KEY, MAX_RECENT_SEARCHES } from '../constants';

/**
 * Persists the visitor's recent search terms to localStorage so search
 * surfaces (Header, Search page) can offer them back as quick shortcuts.
 * Falls back gracefully if storage is unavailable.
 */
export const useRecentSearches = () => {
  const [recent, setRecent] = useState(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const addRecent = useCallback((term) => {
    const clean = term.trim();
    if (!clean) return;
    setRecent((prev) => {
      const next = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch { /* storage unavailable */ }
  }, []);

  return { recent, addRecent, clearRecent };
};
