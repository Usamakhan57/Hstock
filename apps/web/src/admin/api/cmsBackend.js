/**
 * Adapters that keep admin CMS pages on named get/update/CRUD helpers
 * while persisting to Mongo via /api/v1/cms.
 */
import { cmsApi } from '../../services/cmsApi';

function nextId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createCmsSingleton(key, seed = {}) {
  return {
    async get() {
      try {
        // Admin reads must use authenticated endpoint (drafts + email templates).
        const data = await cmsApi.getAdmin(key, { force: true });
        return { ...(seed || {}), ...(data || {}) };
      } catch {
        return { ...(seed || {}) };
      }
    },
    async update(patch) {
      const current = await this.get();
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      return cmsApi.update(key, next);
    },
  };
}

export function createCmsList(key, seedItems = []) {
  const readItems = async () => {
    try {
      const data = await cmsApi.getAdmin(key, { force: true });
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data)) return data;
      return [...seedItems];
    } catch {
      return [...seedItems];
    }
  };

  const writeItems = async (items) => {
    const saved = await cmsApi.update(key, { items });
    return Array.isArray(saved?.items) ? saved.items : items;
  };

  return {
    async getAll() {
      return readItems();
    },
    async getById(id) {
      const items = await readItems();
      return items.find((row) => String(row.id) === String(id)) || null;
    },
    async create(item) {
      const items = await readItems();
      const record = {
        id: item.id || nextId(key),
        createdAt: new Date().toISOString(),
        ...item,
      };
      const next = [record, ...items];
      await writeItems(next);
      return record;
    },
    async update(id, patch) {
      const items = await readItems();
      const idx = items.findIndex((row) => String(row.id) === String(id));
      if (idx === -1) throw new Error(`${key} record not found`);
      items[idx] = {
        ...items[idx],
        ...patch,
        id: items[idx].id,
        updatedAt: new Date().toISOString(),
      };
      await writeItems(items);
      return { ...items[idx] };
    },
    async remove(id) {
      const items = await readItems();
      const idx = items.findIndex((row) => String(row.id) === String(id));
      if (idx === -1) throw new Error(`${key} record not found`);
      const [removed] = items.splice(idx, 1);
      await writeItems(items);
      return removed;
    },
    async removeMany(ids) {
      const idSet = new Set(ids.map(String));
      const items = (await readItems()).filter((row) => !idSet.has(String(row.id)));
      await writeItems(items);
      return true;
    },
  };
}

export default {
  createCmsSingleton,
  createCmsList,
};
