/**
 * Shared username rules for seller identity (slug / profile / uniqueness).
 * Pattern: 3–30 chars, letters, numbers, underscore, hyphen.
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Normalize + validate a username. Returns lowercase form.
 * @param {unknown} raw
 * @returns {{ ok: true, username: string } | { ok: false, message: string, code: string }}
 */
export function normalizeUsername(raw) {
  const username = String(raw || '').trim();
  if (!username) {
    return { ok: false, message: 'Username is required', code: 'USERNAME_REQUIRED' };
  }
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return {
      ok: false,
      message: `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters`,
      code: 'USERNAME_LENGTH',
    };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      message: 'Username may only contain letters, numbers, underscores, and hyphens',
      code: 'USERNAME_INVALID',
    };
  }
  return { ok: true, username: username.toLowerCase() };
}

/** Map a validated username to a store slug (preserves _ and -). */
export function usernameToSlug(username) {
  return String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
}

export default {
  USERNAME_MIN,
  USERNAME_MAX,
  USERNAME_PATTERN,
  normalizeUsername,
  usernameToSlug,
};
