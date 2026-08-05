import { NaumenApiClient } from './api/naumen-api-client.js';
import { AuthApi } from './api/auth-api.js';
import { AuthSession } from './core/auth-session.js';
import { hasAnyRole } from './core/permissions.js';

const config = globalThis.ITSM_CONFIG || {};

export const authSession = new AuthSession({
  storageKey: config.sessionStorageKey,
  languageStorageKey: config.languageStorageKey,
  defaultLanguage: config.defaultLanguage
});

export const apiClient = new NaumenApiClient(config, authSession, {
  onSessionInvalid: () => redirectToLogin()
});

export const authApi = new AuthApi(apiClient);

export async function login(loginValue, password) {
  const result = await authApi.login(loginValue, password);
  authSession.set(result);
  return result.user;
}

export async function refreshSession() {
  const result = await authApi.refresh();
  authSession.replaceToken(result.sessionToken, result.expiresAt);
  return authSession.get();
}

export async function logout() {
  try {
    if (authSession.getSessionToken()) await authApi.logout();
  } finally {
    authSession.clear();
    redirectToLogin({ preserveReturnUrl: false });
  }
}

export async function verifyCurrentUser() {
  if (!authSession.getSessionToken()) return null;
  const result = await authApi.getCurrentUser();
  const user = result.user || result;
  authSession.updateCurrentUser(user, result.expiresAt);
  return user;
}

export async function guardPage(requiredRoles = []) {
  if (!authSession.getSessionToken()) {
    redirectToLogin();
    return { status: 'redirected', user: null };
  }

  try {
    const user = await verifyCurrentUser();
    if (!user) {
      redirectToLogin();
      return { status: 'redirected', user: null };
    }
    if (!hasAnyRole(user, requiredRoles)) return { status: 'forbidden', user };
    return { status: 'ready', user };
  } catch (error) {
    if (!authSession.getSessionToken()) return { status: 'redirected', user: null, error };
    return { status: 'error', user: authSession.getCurrentUser(), error };
  }
}

export function redirectToLogin(options = {}) {
  const loginUrl = new URL(resolveAppPath('login.html'), globalThis.location.href);
  if (options.preserveReturnUrl !== false && !globalThis.location.pathname.endsWith('/login.html')) {
    loginUrl.searchParams.set('returnUrl', globalThis.location.pathname + globalThis.location.search);
  }
  globalThis.location.replace(loginUrl.href);
}

export function getSafeReturnUrl() {
  const value = new URLSearchParams(globalThis.location.search).get('returnUrl');
  if (!value) return resolveAppPath('service-catalog.html');
  const target = new URL(value, globalThis.location.origin);
  if (target.origin !== globalThis.location.origin || target.pathname.endsWith('/login.html')) {
    return resolveAppPath('service-catalog.html');
  }
  return target.pathname + target.search;
}

function resolveAppPath(path) {
  return globalThis.location.pathname.includes('/admin/') ? '../' + path : path;
}
