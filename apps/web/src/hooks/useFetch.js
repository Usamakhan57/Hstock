import { useState, useEffect } from 'react';

/**
 * Small data-fetching hook used with the API service layer.
 * Returns { data, loading, error, retry } — pages render skeleton loaders
 * while `loading` is true and an error state if the request fails. Works
 * identically once the service layer points at the real backend.
 *
 * @param {() => Promise<any>} fetcher  function returning a promise
 * @param {any[]} deps                  dependency list that re-triggers the fetch
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => { if (alive) { setData(res); setLoading(false); } })
      .catch((err) => { if (alive) { setError(err); setLoading(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = () => setTick((t) => t + 1);

  return { data, loading, error, retry };
}

export default useFetch;
