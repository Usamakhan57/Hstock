import slugify from 'slugify';

export function toSlug(value, options = {}) {
  return slugify(String(value || ''), {
    lower: true,
    strict: true,
    trim: true,
    ...options,
  });
}

export function uniqueSlug(base, suffix) {
  const slug = toSlug(base);
  return suffix ? `${slug}-${suffix}` : slug;
}

export default {
  toSlug,
  uniqueSlug,
};
