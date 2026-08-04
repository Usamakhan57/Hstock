import { useCallback, useEffect, useState } from 'react';
import { cmsApi, invalidateCmsClientCache, subscribeCmsUpdates } from '../services/cmsApi';

/**
 * Live CMS document hook.
 * Re-fetches when admin saves (BroadcastChannel / CustomEvent) or versions change.
 */
export function useCms(key, { enabled = true } = {}) {
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
      const next = await cmsApi.get(key, { force });
      setData(next);
      setVersion((v) => v + 1);
      return next;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled || !key) return undefined;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const next = await cmsApi.get(key);
        if (alive) setData(next);
      } catch (err) {
        if (alive) setError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const unsubscribe = subscribeCmsUpdates((detail) => {
      if (!detail?.key || detail.key === key) {
        refresh({ force: true });
      }
    });

    // Soft poll versions while the tab is visible so other browsers pick up saves.
    let timer = null;
    let knownVersion = null;
    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const versions = await cmsApi.getVersions({ force: true });
        const remote = versions?.versions?.[key]?.version;
        if (remote == null) return;
        if (knownVersion == null) {
          knownVersion = remote;
          return;
        }
        if (remote !== knownVersion) {
          knownVersion = remote;
          refresh({ force: true });
        }
      } catch {
        // ignore poll errors
      }
    };
    timer = window.setInterval(poll, 8000);

    return () => {
      alive = false;
      unsubscribe();
      if (timer) window.clearInterval(timer);
    };
  }, [enabled, key, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refresh, version };
}

export default useCms;
