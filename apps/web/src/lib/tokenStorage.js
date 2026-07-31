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

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_KEY) !== 'false';
}

export function setRememberMe(remember) {
  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistSession({ accessToken, refreshToken, user, remember = getRememberMe() }) {
  setRememberMe(remember);
  const primary = store(remember);
  const secondary = otherStore(remember);

  secondary.removeItem(ACCESS_KEY);
  secondary.removeItem(REFRESH_KEY);
  secondary.removeItem(USER_KEY);

  if (accessToken) primary.setItem(ACCESS_KEY, accessToken);
  else primary.removeItem(ACCESS_KEY);

  if (refreshToken) primary.setItem(REFRESH_KEY, refreshToken);
  else primary.removeItem(REFRESH_KEY);

  if (user) primary.setItem(USER_KEY, JSON.stringify(user));
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
