/**
 * Token persistence for JWT access + refresh.
 * Remember Me → localStorage; otherwise sessionStorage.
 */

const ACCESS_KEY = 'hs_access_token';
const REFRESH_KEY = 'hs_refresh_token';
const REMEMBER_KEY = 'hs_remember_me';
const USER_KEY = 'hs_auth_user';

function store(remember) {
  return remember ? localStorage : sessionStorage;
}

function otherStore(remember) {
  return remember ? sessionStorage : localStorage;
}

function readRaw(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_KEY) !== 'false';
}

export function setRememberMe(remember) {
  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
}

export function getAccessToken() {
  return readRaw(ACCESS_KEY);
}

export function getRefreshToken() {
  return readRaw(REFRESH_KEY);
}

export function getStoredUser() {
  try {
    const raw = readRaw(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist session fields.
 * `undefined` means "leave existing value as-is" so profile refreshes
 * do not wipe the refresh token and break silent re-auth.
 */
export function persistSession({
  accessToken,
  refreshToken,
  user,
  remember = getRememberMe(),
} = {}) {
  setRememberMe(remember);
  const primary = store(remember);
  const secondary = otherStore(remember);

  const nextAccess = accessToken !== undefined ? accessToken : readRaw(ACCESS_KEY);
  const nextRefresh = refreshToken !== undefined ? refreshToken : readRaw(REFRESH_KEY);
  const nextUser = user !== undefined ? user : getStoredUser();

  secondary.removeItem(ACCESS_KEY);
  secondary.removeItem(REFRESH_KEY);
  secondary.removeItem(USER_KEY);

  if (nextAccess) primary.setItem(ACCESS_KEY, nextAccess);
  else primary.removeItem(ACCESS_KEY);

  if (nextRefresh) primary.setItem(REFRESH_KEY, nextRefresh);
  else primary.removeItem(REFRESH_KEY);

  if (nextUser) primary.setItem(USER_KEY, JSON.stringify(nextUser));
  else primary.removeItem(USER_KEY);
}

export function clearSession() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
    storage.removeItem(USER_KEY);
  });
}

export default {
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  persistSession,
  clearSession,
  getRememberMe,
  setRememberMe,
};
