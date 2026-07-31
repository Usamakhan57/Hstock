/**
 * Generic mock data engine backing every admin resource (Products,
 * Categories, Orders, etc.). Each resource file in admin/api/ (e.g.
 * products.js) calls createResource()/createSingleton() once and
 * re-exports named functions — pages never import this file directly.
 *
 * WHY THIS SHAPE: every function here is async and returns/throws
 * exactly like a fetch() call against a REST API would. That means
 * connecting the real Node + Express + MongoDB backend later is a
 * one-file change PER RESOURCE — swap the body of createResource() (or
 * just the individual resource file) from localStorage reads/writes to
 * `fetch('/api/products')` etc. No page or component needs to change,
 * because they only ever call named functions like getProducts(),
 * createProduct(id, patch), never touch storage directly.
 *
 * Example future replacement for admin/api/products.js:
 *   export const getProducts = () => fetch('/api/products').then(r => r.json());
 *   export const createProduct = (data) => fetch('/api/products', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json());
 *   ...same exported names, same call signatures, zero UI changes.
 */

const SIMULATED_LATENCY_MS = 200;

const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));

let idCounter = Date.now();
export const nextId = () => (++idCounter).toString(36);

function readStore(key, seed) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted storage — fall through to reseed
  }
  writeStore(key, seed);
  return JSON.parse(JSON.stringify(seed));
}

function writeStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage unavailable (private browsing / quota) — mutations won't
    // persist across reloads this session, but the admin UI keeps working
    // against the in-memory cache.
  }
}

/**
 * Creates a list-based resource (Products, Orders, Customers, etc.)
 * with standard CRUD + bulk delete, all backed by localStorage under
 * the key `pm_admin_<name>`.
 */
export function createResource(name, seed) {
  const key = `pm_admin_${name}`;
  let cache = null;

  const load = () => {
    if (cache === null) cache = readStore(key, seed);
    return cache;
  };
  const persist = () => writeStore(key, cache);

  return {
    async getAll() {
      return wait([...load()]);
    },
    async getById(id) {
      const found = load().find((r) => String(r.id) === String(id));
      return wait(found ? { ...found } : null);
    },
    async create(item) {
      const record = { id: nextId(), createdAt: new Date().toISOString(), ...item };
      load().unshift(record);
      persist();
      return wait({ ...record });
    },
    async update(id, patch) {
      const list = load();
      const idx = list.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) throw new Error(`${name} record not found`);
      list[idx] = { ...list[idx], ...patch, id: list[idx].id, updatedAt: new Date().toISOString() };
      persist();
      return wait({ ...list[idx] });
    },
    async remove(id) {
      const list = load();
      const idx = list.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) throw new Error(`${name} record not found`);
      const [removed] = list.splice(idx, 1);
      persist();
      return wait(removed);
    },
    async removeMany(ids) {
      const idSet = new Set(ids.map(String));
      cache = load().filter((r) => !idSet.has(String(r.id)));
      persist();
      return wait(true);
    },
  };
}

/**
 * Creates a singleton resource (Settings is the only current example) —
 * a single object rather than a list, with get/update.
 */
export function createSingleton(name, seed) {
  const key = `pm_admin_${name}`;
  let cache = null;

  const load = () => {
    if (cache === null) cache = readStore(key, seed);
    return cache;
  };

  return {
    async get() {
      return wait({ ...load() });
    },
    async update(patch) {
      cache = { ...load(), ...patch, updatedAt: new Date().toISOString() };
      writeStore(key, cache);
      return wait({ ...cache });
    },
  };
}
