import { defaultHomeForUser, isSeller, isAdmin } from '../context/AuthRoles';

/**
 * Resolve SPA destination after Google OAuth.
 * Never navigate to /seller/* without the seller role (avoids 403 Access Denied).
 */
export function resolveGoogleCallbackDestination(requestedRedirect, user) {
  const home = defaultHomeForUser(user);
  const safeRedirect = requestedRedirect
    && requestedRedirect.startsWith('/')
    && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : null;

  if (!safeRedirect) return home;

  if (safeRedirect.startsWith('/seller') && !isSeller(user)) {
    return home;
  }
  if (safeRedirect.startsWith('/admin') && !isAdmin(user)) {
    return home;
  }
  return safeRedirect;
}

export default { resolveGoogleCallbackDestination };
