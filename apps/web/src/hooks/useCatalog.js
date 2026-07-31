import { useSyncExternalStore } from 'react';
import {
  getCatalogVersion,
  subscribeCatalog,
  isCatalogHydrated,
} from '../services/catalogCache';

/**
 * Subscribe to catalog cache hydration so sync repository readers re-render.
 */
export function useCatalogVersion() {
  return useSyncExternalStore(subscribeCatalog, getCatalogVersion, () => 0);
}

export function useCatalogReady() {
  const version = useCatalogVersion();
  return { ready: isCatalogHydrated() || version > 0, version };
}

export default useCatalogVersion;
