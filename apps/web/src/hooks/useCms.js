import { useCallback, useEffect, useState } from 'react';
import {
  cmsApi,
  invalidateCmsClientCache,
  subscribeCmsUpdates,
  subscribeCmsVersionChanges,
  ensureCmsVersionPoller,
} from '../services/cmsApi';

/**
 * Live CMS document hook.
 * Uses ONE global version poller (shared across all useCms calls).
 * Also refreshes on BroadcastChannel / CustomEvent admin saves.
 */
export function useCms(key, { enabled = true, admin = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && key));
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async ({ force = true } = {}) => {
    if (!enabled || !key) return null;
    setLoading(true);
    setError(null);
    try {
      if (force) invalidateCmsClientCache(key);
      const next = await cmsApi.get(key, { force, admin });
      setData(next);
      setVersion((v) => v + 1);
      return next;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, key, admin]);

  useEffect(() => {
    if (!enabled || !key) return undefined;
    let alive = true;
    ensureCmsVersionPoller();

    (async () => {
      setLoading(true);
      try {
        const next = await cmsApi.get(key, { admin });
        if (alive) setData(next);
      } catch (err) {
        if (alive) setError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const unsubscribeLocal = subscribeCmsUpdates((detail) => {
      if (!detail?.key || detail.key === key) {
        refresh({ force: true });
      }
    });

    const unsubscribeVersions = subscribeCmsVersionChanges((detail) => {
      if (!detail?.keys?.length || detail.keys.includes(key)) {
        refresh({ force: true });
      }
    });

    return () => {
      alive = false;
      unsubscribeLocal();
      unsubscribeVersions();
    };
  }, [enabled, key, admin, refresh]);

  return { data, loading, error, refresh, version };
}

export default useCms;
