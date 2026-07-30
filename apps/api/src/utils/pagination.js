/**
 * Normalize page/limit query params for list endpoints (Phase 2+).
 */
export function parsePagination(query = {}, defaults = { page: 1, limit: 20, maxLimit: 100 }) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? defaults.page), 10) || defaults.page);
  let limit = Number.parseInt(String(query.limit ?? defaults.limit), 10) || defaults.limit;
  limit = Math.min(Math.max(1, limit), defaults.maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export default {
  parsePagination,
  buildPaginationMeta,
};
